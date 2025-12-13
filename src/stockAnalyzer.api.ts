import type {
  SearchResult,
  StockData,
  TechnicalIndicators,
  Analysis,
  PriceData,
  Currency,
  ValuationData,
} from './stockAnalyzer.types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;

const CORS_PROXY = 'https://corsproxy.io/?';

function proxiedFetch(url: string): Promise<Response> {
  return fetch(CORS_PROXY + encodeURIComponent(url));
}

export async function fetchExchangeRate(
  from: string,
  to: Currency
): Promise<number> {
  if (from === to) return 1;

  try {
    const symbol = `${from}${to}=X`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const response = await proxiedFetch(url);
    const data = await response.json();
    const rate = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (rate) return rate;
  } catch (e) {
    console.error('Exchange rate error:', e);
  }

  return 1;
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

export interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  currency: string;
}

async function fetchStockQuote(symbol: string): Promise<TrendingStock | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const response = await proxiedFetch(url);
    const data = await response.json();

    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    if (!meta || !quote) return null;

    const previousClose = meta.chartPreviousClose || meta.previousClose || 0;
    const currentPrice = meta.regularMarketPrice || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    return {
      symbol: meta.symbol,
      name: meta.shortName || meta.longName || meta.symbol,
      price: currentPrice,
      change,
      changePercent,
      volume: meta.regularMarketVolume || 0,
      currency: meta.currency || 'USD',
    };
  } catch {
    return null;
  }
}

async function fetchYahooValuationData(symbol: string): Promise<ValuationData> {
  // First, get 52-week range from chart endpoint
  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y&includePrePost=false`;
  const chartResponse = await proxiedFetch(chartUrl);
  const chartData = await chartResponse.json();

  const chartResult = chartData.chart?.result?.[0];
  if (!chartResult) {
    throw new Error('Données de valorisation indisponibles');
  }

  const meta = chartResult.meta;

  // Default values from chart data
  const valuationData: ValuationData = {
    trailingPE: null,
    forwardPE: null,
    pegRatio: null,
    priceToBook: null,
    epsTrailingTwelveMonths: null,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
    currentPrice: meta.regularMarketPrice ?? 0,
  };

  // Try to get fundamental ratios from quoteSummary endpoint
  try {
    const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail,defaultKeyStatistics`;
    const summaryResponse = await proxiedFetch(summaryUrl);
    const summaryData = await summaryResponse.json();

    const summaryDetail = summaryData.quoteSummary?.result?.[0]?.summaryDetail;
    const keyStats = summaryData.quoteSummary?.result?.[0]?.defaultKeyStatistics;

    if (summaryDetail) {
      valuationData.trailingPE = summaryDetail.trailingPE?.raw ?? null;
      valuationData.forwardPE = summaryDetail.forwardPE?.raw ?? null;
    }

    if (keyStats) {
      valuationData.pegRatio = keyStats.pegRatio?.raw ?? null;
      valuationData.priceToBook = keyStats.priceToBook?.raw ?? null;
      valuationData.epsTrailingTwelveMonths = keyStats.trailingEps?.raw ?? null;
      // Fallback for forwardPE if not in summaryDetail
      if (valuationData.forwardPE === null) {
        valuationData.forwardPE = keyStats.forwardPE?.raw ?? null;
      }
    }
  } catch (e) {
    console.error('Yahoo quoteSummary error:', e);
    // Continue with chart data only
  }

  return valuationData;
}

interface FmpRatioResponse {
  symbol: string;
  peRatioTTM: number | null;
  pegRatioTTM: number | null;
  priceToBookRatioTTM: number | null;
  priceEarningsToGrowthRatioTTM: number | null;
}

async function fetchFmpValuationData(symbol: string): Promise<Partial<ValuationData>> {
  if (!FMP_API_KEY) {
    return {};
  }

  try {
    // Use the stable endpoint (legacy /api/v3/ is deprecated)
    const url = `https://financialmodelingprep.com/stable/ratios-ttm?symbol=${encodeURIComponent(symbol)}&apikey=${FMP_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('FMP API error:', response.status, response.statusText);
      return {};
    }

    const data = await response.json();

    // Handle error response from FMP
    if (data && 'Error Message' in data) {
      console.error('FMP API error:', data['Error Message']);
      return {};
    }

    // Response can be an array or single object
    const ratios: FmpRatioResponse | undefined = Array.isArray(data) ? data[0] : data;

    if (!ratios) {
      return {};
    }

    return {
      trailingPE: ratios.peRatioTTM ?? null,
      pegRatio: ratios.pegRatioTTM ?? ratios.priceEarningsToGrowthRatioTTM ?? null,
      priceToBook: ratios.priceToBookRatioTTM ?? null,
    };
  } catch (e) {
    console.error('FMP API error:', e);
    return {};
  }
}

export async function fetchValuationData(symbol: string): Promise<ValuationData> {
  // Fetch Yahoo data first (for 52W range and basic data)
  const yahooData = await fetchYahooValuationData(symbol);

  // Check if we're missing key ratios
  const missingRatios =
    yahooData.trailingPE === null &&
    yahooData.pegRatio === null &&
    yahooData.priceToBook === null;

  // If missing ratios and FMP key is available, try FMP as fallback
  if (missingRatios && FMP_API_KEY) {
    const fmpData = await fetchFmpValuationData(symbol);

    return {
      ...yahooData,
      trailingPE: fmpData.trailingPE ?? yahooData.trailingPE,
      pegRatio: fmpData.pegRatio ?? yahooData.pegRatio,
      priceToBook: fmpData.priceToBook ?? yahooData.priceToBook,
    };
  }

  return yahooData;
}

export async function fetchTrendingStocks(): Promise<TrendingStock[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/trending/US?count=15`;
    const response = await proxiedFetch(url);
    const data = await response.json();

    const symbols: string[] =
      data.finance?.result?.[0]?.quotes
        ?.map((q: { symbol: string }) => q.symbol)
        ?.filter(
          (s: string) =>
            !s.startsWith('^') && !s.includes('-USD') && !s.includes('=')
        ) || [];

    if (symbols.length === 0) return [];

    const quotes = await Promise.all(
      symbols.slice(0, 10).map((symbol) => fetchStockQuote(symbol))
    );

    return quotes.filter((q): q is TrendingStock => q !== null);
  } catch (e) {
    console.error('Trending stocks error:', e);
  }
  return [];
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
