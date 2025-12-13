import type {
  SearchResult,
  StockData,
  TechnicalIndicators,
  Analysis,
  PriceData,
} from './stockAnalyzer.types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const CORS_PROXY = 'https://corsproxy.io/?';

function proxiedFetch(url: string): Promise<Response> {
  return fetch(CORS_PROXY + encodeURIComponent(url));
}

export async function searchTickers(query: string): Promise<SearchResult[]> {
  if (query.length < 2) return [];
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    const response = await proxiedFetch(url);
    const data = await response.json();
    if (data.quotes) {
      return data.quotes
        .filter((q: Record<string, unknown>) => q.quoteType === 'EQUITY')
        .map((q: Record<string, string>) => ({
          symbol: q.symbol,
          name: q.longname || q.shortname || q.symbol,
          type: q.quoteType,
          region: q.exchange,
          currency: q.currency || 'USD',
        }));
    }
  } catch (e) {
    console.error('Search error:', e);
  }
  return [];
}

export async function fetchDailyPrices(
  symbol: string
): Promise<PriceData | null> {
  const period1 = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
  const period2 = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d`;

  const response = await proxiedFetch(url);
  const data = await response.json();

  if (data.chart?.error) {
    throw new Error(data.chart.error.description || 'Ticker non trouvé');
  }

  const result = data.chart?.result?.[0];
  if (!result) {
    throw new Error('Données indisponibles pour ce ticker');
  }

  const timestamps = result.timestamp;
  const quote = result.indicators?.quote?.[0];

  if (!timestamps || !quote) {
    throw new Error('Format de données invalide');
  }

  const dates: string[] = [];
  const opens: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];
  const closes: number[] = [];
  const volumes: number[] = [];

  for (let i = timestamps.length - 1; i >= 0 && dates.length < 250; i--) {
    if (quote.close[i] != null) {
      dates.push(new Date(timestamps[i] * 1000).toISOString().split('T')[0]);
      opens.push(quote.open[i]);
      highs.push(quote.high[i]);
      lows.push(quote.low[i]);
      closes.push(quote.close[i]);
      volumes.push(quote.volume[i]);
    }
  }

  return { dates, opens, highs, lows, closes, volumes };
}

export async function analyzeWithGroq(
  stock: StockData,
  indicators: TechnicalIndicators
): Promise<Analysis> {
  const cs =
    stock.currency === 'EUR' ? '€' : stock.currency === 'GBP' ? '£' : '$';
  const prompt = `Tu es un analyste financier. Analyse ${stock.ticker} (${stock.name}) pour investissement LONG TERME.

DONNÉES:
- Prix: ${stock.price.toFixed(2)}${cs} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
- MM200: ${indicators.mm200.toFixed(2)}${cs} (cours ${indicators.priceAboveMM200 ? 'AU-DESSUS ✓' : 'EN DESSOUS ✗'})
- RSI: ${indicators.rsi.toFixed(1)} ${indicators.rsi > 70 ? '(SURACHAT)' : indicators.rsi < 30 ? '(SURVENTE)' : indicators.rsi > 50 ? '(ACHAT)' : '(NEUTRE)'}
- MACD: ${indicators.macd.toFixed(4)} vs Signal ${indicators.macdSignal.toFixed(4)} (${indicators.macd > indicators.macdSignal ? 'HAUSSIER' : 'BAISSIER'})
- ATR: ${indicators.atr.toFixed(2)}${cs} (${((indicators.atr / stock.price) * 100).toFixed(1)}% volatilité)

SCORING: Cours>MM200 (+2), RSI 50-70 (+2), RSI>70 (-2), MACD>Signal (+1)
VERDICT: Score>=4 → FAVORABLE, 1-3 → NEUTRE, <=0 → DÉFAVORABLE

Réponds UNIQUEMENT en JSON:
{"verdict":"FAVORABLE|NEUTRE|DÉFAVORABLE","score":<int>,"summary":"<2 phrases>","positives":["..."],"warnings":["..."],"negatives":["..."]}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  try {
    const content = data.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const p = JSON.parse(jsonMatch[0]);
      return {
        verdict: p.verdict,
        score: p.score,
        emoji:
          p.verdict === 'FAVORABLE'
            ? '🟢'
            : p.verdict === 'NEUTRE'
              ? '🟠'
              : '🔴',
        color:
          p.verdict === 'FAVORABLE'
            ? 'green'
            : p.verdict === 'NEUTRE'
              ? 'orange'
              : 'red',
        summary: p.summary,
        positives: p.positives || [],
        warnings: p.warnings || [],
        negatives: p.negatives || [],
      };
    }
  } catch {
    /* fallback */
  }
  return {
    verdict: 'NEUTRE',
    score: 0,
    emoji: '🟠',
    color: 'orange',
    summary: 'Analyse indisponible',
    positives: [],
    warnings: ['Erreur parsing'],
    negatives: [],
  };
}
