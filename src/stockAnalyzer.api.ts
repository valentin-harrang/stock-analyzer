import type {
  SearchResult,
  StockData,
  TechnicalIndicators,
  Analysis,
  PriceData,
  Currency,
  ValuationData,
  DividendData,
  FinancialStatements,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
} from './stockAnalyzer.types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

async function proxiedFetch(url: string, proxyIndex = 0): Promise<Response> {
  const proxy = CORS_PROXIES[proxyIndex];
  const response = await fetch(proxy + encodeURIComponent(url));

  // If unauthorized or forbidden, try next proxy
  if ((response.status === 401 || response.status === 403) && proxyIndex < CORS_PROXIES.length - 1) {
    return proxiedFetch(url, proxyIndex + 1);
  }

  return response;
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

async function fetchYahooChartData(symbol: string): Promise<ValuationData> {
  // Get 52-week range from chart endpoint (this one works without auth)
  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y&includePrePost=false`;
  const chartResponse = await proxiedFetch(chartUrl);
  const chartData = await chartResponse.json();

  const chartResult = chartData.chart?.result?.[0];
  if (!chartResult) {
    throw new Error('Données de valorisation indisponibles');
  }

  const meta = chartResult.meta;

  return {
    trailingPE: null,
    pegRatio: null,
    priceToBook: null,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
    currentPrice: meta.regularMarketPrice ?? 0,
  };
}

interface FmpRatiosTTM {
  priceToEarningsRatioTTM: number | null;
  priceToEarningsGrowthRatioTTM: number | null;
  priceToBookRatioTTM: number | null;
}

async function fetchFmpValuationData(symbol: string): Promise<Partial<ValuationData>> {
  // Skip FMP for European stocks - requires premium subscription
  if (!FMP_API_KEY || isEuropeanSymbol(symbol)) {
    return {};
  }

  try {
    const url = `https://financialmodelingprep.com/stable/ratios-ttm?symbol=${encodeURIComponent(symbol)}&apikey=${FMP_API_KEY}`;
    const response = await fetch(url);

    // Handle premium required error
    if (!response.ok || response.status === 402) {
      return {};
    }

    const data = await response.json();

    // Check for premium error in response body
    if (data?.['Error Message'] || (typeof data === 'string' && data.includes('premium')) || !Array.isArray(data) || data.length === 0) {
      return {};
    }

    const ratios = data[0] as FmpRatiosTTM;

    return {
      trailingPE: ratios.priceToEarningsRatioTTM ?? null,
      pegRatio: ratios.priceToEarningsGrowthRatioTTM ?? null,
      priceToBook: ratios.priceToBookRatioTTM ?? null,
    };
  } catch (e) {
    console.error('FMP API error:', e);
    return {};
  }
}

interface FinnhubMetric {
  peBasicExclExtraTTM?: number;
  peExclExtraTTM?: number;
  pbQuarterly?: number;
  pbAnnual?: number;
  pegRatio?: number;
  dividendYieldIndicatedAnnual?: number;
  roeTTM?: number;
  currentRatioQuarterly?: number;
}

interface FinnhubBasicFinancials {
  metric: FinnhubMetric;
}

async function fetchFinnhubValuationData(symbol: string): Promise<Partial<ValuationData>> {
  if (!FINNHUB_API_KEY) {
    return {};
  }

  try {
    // Finnhub uses different symbol format for European stocks
    // Yahoo: CAP.PA -> Finnhub: CAP.PA (same for Euronext)
    const url = `https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      return {};
    }

    const data: FinnhubBasicFinancials = await response.json();

    if (!data.metric) {
      return {};
    }

    const metric = data.metric;

    return {
      trailingPE: metric.peBasicExclExtraTTM ?? metric.peExclExtraTTM ?? null,
      pegRatio: metric.pegRatio ?? null,
      priceToBook: metric.pbQuarterly ?? metric.pbAnnual ?? null,
    };
  } catch (e) {
    console.error('Finnhub API error:', e);
    return {};
  }
}

// Detect if symbol is European (ends with .PA, .DE, .L, .AS, .BR, etc.)
function isEuropeanSymbol(symbol: string): boolean {
  const europeanSuffixes = ['.PA', '.DE', '.L', '.AS', '.BR', '.MI', '.MC', '.LS', '.VI', '.HE', '.ST', '.OL', '.CO'];
  return europeanSuffixes.some(suffix => symbol.toUpperCase().endsWith(suffix));
}

export async function fetchValuationData(symbol: string): Promise<ValuationData> {
  // Fetch Yahoo chart data (for 52W range)
  const yahooChartData = await fetchYahooChartData(symbol);

  // Try Finnhub first (works for all stocks with free tier)
  if (FINNHUB_API_KEY) {
    const finnhubData = await fetchFinnhubValuationData(symbol);
    if (finnhubData.trailingPE || finnhubData.pegRatio || finnhubData.priceToBook) {
      return {
        ...yahooChartData,
        trailingPE: finnhubData.trailingPE ?? null,
        pegRatio: finnhubData.pegRatio ?? null,
        priceToBook: finnhubData.priceToBook ?? null,
      };
    }
  }

  // Fallback to FMP for US stocks only
  if (FMP_API_KEY && !isEuropeanSymbol(symbol)) {
    const fmpData = await fetchFmpValuationData(symbol);
    if (fmpData.trailingPE || fmpData.pegRatio || fmpData.priceToBook) {
      return {
        ...yahooChartData,
        trailingPE: fmpData.trailingPE ?? null,
        pegRatio: fmpData.pegRatio ?? null,
        priceToBook: fmpData.priceToBook ?? null,
      };
    }
  }

  return yahooChartData;
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

// ============================================
// DIVIDEND DATA FETCHING
// ============================================

interface FmpKeyMetrics {
  dividendYield: number | null;
  payoutRatio: number | null;
}

export async function fetchDividendData(symbol: string): Promise<DividendData | null> {
  // Try Finnhub first (works for all stocks with free tier)
  if (FINNHUB_API_KEY) {
    const finnhubData = await fetchFinnhubDividendData(symbol);
    if (finnhubData && (finnhubData.dividendYield || finnhubData.dividendPerShare)) {
      return finnhubData;
    }
  }

  // Fallback to FMP for US stocks only
  if (FMP_API_KEY && !isEuropeanSymbol(symbol)) {
    return await fetchFmpDividendData(symbol);
  }

  return null;
}

async function fetchFinnhubDividendData(symbol: string): Promise<DividendData | null> {
  if (!FINNHUB_API_KEY) return null;

  try {
    const url = `https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();
    const metric = data.metric;

    if (!metric) return null;

    return {
      dividendYield: metric.dividendYieldIndicatedAnnual ?? null,
      dividendPerShare: metric.dividendPerShareAnnual ?? null,
      payoutRatio: metric.payoutRatioAnnual ?? null,
      exDividendDate: null,
      paymentDate: null,
      dividendGrowth5Y: metric.dividendGrowthRate5Y ?? null,
      consecutiveYears: null,
    };
  } catch (e) {
    console.error('Finnhub dividend error:', e);
    return null;
  }
}


async function fetchFmpDividendData(symbol: string): Promise<DividendData | null> {
  if (!FMP_API_KEY) return null;

  // Skip FMP for European stocks - they require premium subscription
  if (isEuropeanSymbol(symbol)) {
    return null;
  }

  try {
    // Fetch key metrics for yield and payout ratio (free tier for US stocks)
    const metricsUrl = `https://financialmodelingprep.com/stable/key-metrics-ttm?symbol=${encodeURIComponent(symbol)}&apikey=${FMP_API_KEY}`;
    const metricsResponse = await fetch(metricsUrl);

    let dividendYield: number | null = null;
    let payoutRatio: number | null = null;

    if (metricsResponse.ok) {
      const metricsData: FmpKeyMetrics[] = await metricsResponse.json();
      // Check for premium error in response
      if (Array.isArray(metricsData) && metricsData.length > 0 && !('Error Message' in metricsData[0])) {
        dividendYield = metricsData[0].dividendYield ?? null;
        payoutRatio = metricsData[0].payoutRatio ?? null;
      }
    } else if (metricsResponse.status === 402) {
      // Premium required - return null to fallback to Finnhub
      return null;
    }

    return {
      dividendYield: dividendYield ? dividendYield * 100 : null,
      dividendPerShare: null,
      payoutRatio: payoutRatio ? payoutRatio * 100 : null,
      exDividendDate: null,
      paymentDate: null,
      dividendGrowth5Y: null,
      consecutiveYears: null,
    };
  } catch (e) {
    console.error('FMP dividend error:', e);
    return null;
  }
}

// ============================================
// FINANCIAL STATEMENTS FETCHING
// ============================================

interface FmpIncomeStatement {
  date: string;
  calendarYear: string;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  eps: number;
  epsdiluted: number;
}

interface FmpBalanceSheet {
  date: string;
  calendarYear: string;
  totalAssets: number;
  totalLiabilities: number;
  totalStockholdersEquity: number;
  totalDebt: number;
  cashAndCashEquivalents: number;
  totalCurrentAssets: number;
  totalCurrentLiabilities: number;
}

interface FmpCashFlow {
  date: string;
  calendarYear: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  dividendsPaid: number;
}

interface FmpRatios {
  grossProfitMargin: number | null;
  operatingProfitMargin: number | null;
  netProfitMargin: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
}

export async function fetchFinancialStatements(symbol: string): Promise<FinancialStatements | null> {
  const isEuropean = isEuropeanSymbol(symbol);

  // For European stocks or if no FMP key, try Finnhub
  if (isEuropean || !FMP_API_KEY) {
    // Try Finnhub for basic metrics
    if (FINNHUB_API_KEY) {
      return await fetchFinnhubFinancialData(symbol);
    }
    return null;
  }

  try {
    // Fetch all financial statements in parallel (only for US stocks on free tier)
    const [incomeRes, balanceRes, cashFlowRes, ratiosRes] = await Promise.all([
      fetch(`https://financialmodelingprep.com/stable/income-statement?symbol=${encodeURIComponent(symbol)}&limit=5&apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/stable/balance-sheet-statement?symbol=${encodeURIComponent(symbol)}&limit=5&apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/stable/cash-flow-statement?symbol=${encodeURIComponent(symbol)}&limit=5&apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/stable/ratios-ttm?symbol=${encodeURIComponent(symbol)}&apikey=${FMP_API_KEY}`),
    ]);

    // Check if any request returned 402 (premium required)
    if ([incomeRes, balanceRes, cashFlowRes, ratiosRes].some(r => r.status === 402)) {
      console.warn('FMP premium required for this symbol, falling back to Finnhub');
      return await fetchFinnhubFinancialData(symbol);
    }

    const [incomeData, balanceData, cashFlowData, ratiosData]: [
      FmpIncomeStatement[],
      FmpBalanceSheet[],
      FmpCashFlow[],
      FmpRatios[]
    ] = await Promise.all([
      incomeRes.ok ? incomeRes.json() : [],
      balanceRes.ok ? balanceRes.json() : [],
      cashFlowRes.ok ? cashFlowRes.json() : [],
      ratiosRes.ok ? ratiosRes.json() : [],
    ]);

    if (!Array.isArray(incomeData) || incomeData.length === 0) {
      return await fetchFinnhubFinancialData(symbol);
    }

    // Process income statements
    const incomeStatements: IncomeStatementData[] = incomeData.map((item, index) => {
      const prevItem = incomeData[index + 1];
      return {
        year: item.calendarYear || item.date.split('-')[0],
        revenue: item.revenue,
        netIncome: item.netIncome,
        grossProfit: item.grossProfit,
        operatingIncome: item.operatingIncome,
        eps: item.epsdiluted || item.eps,
        revenueGrowth: prevItem && prevItem.revenue ? ((item.revenue - prevItem.revenue) / prevItem.revenue) * 100 : null,
        netIncomeGrowth: prevItem && prevItem.netIncome ? ((item.netIncome - prevItem.netIncome) / Math.abs(prevItem.netIncome)) * 100 : null,
      };
    });

    // Process balance sheets
    const balanceSheets: BalanceSheetData[] = balanceData.map((item) => ({
      year: item.calendarYear || item.date.split('-')[0],
      totalAssets: item.totalAssets,
      totalLiabilities: item.totalLiabilities,
      totalEquity: item.totalStockholdersEquity,
      totalDebt: item.totalDebt,
      cash: item.cashAndCashEquivalents,
      debtToEquity: item.totalStockholdersEquity ? (item.totalDebt / item.totalStockholdersEquity) * 100 : null,
      currentRatio: item.totalCurrentLiabilities ? item.totalCurrentAssets / item.totalCurrentLiabilities : null,
    }));

    // Process cash flows
    const cashFlows: CashFlowData[] = cashFlowData.map((item) => ({
      year: item.calendarYear || item.date.split('-')[0],
      operatingCashFlow: item.operatingCashFlow,
      capitalExpenditure: Math.abs(item.capitalExpenditure),
      freeCashFlow: item.freeCashFlow,
      dividendsPaid: Math.abs(item.dividendsPaid || 0),
    }));

    // Calculate key metrics
    const latestRatios = Array.isArray(ratiosData) && ratiosData.length > 0 ? ratiosData[0] : null;

    // Calculate 3Y growth rates
    let revenueGrowth3Y: number | null = null;
    let epsGrowth3Y: number | null = null;

    if (incomeData.length >= 4) {
      const latest = incomeData[0];
      const threeYearsAgo = incomeData[3];
      if (threeYearsAgo.revenue && threeYearsAgo.revenue > 0) {
        revenueGrowth3Y = ((latest.revenue / threeYearsAgo.revenue) ** (1/3) - 1) * 100;
      }
      if (threeYearsAgo.eps && threeYearsAgo.eps > 0) {
        epsGrowth3Y = ((latest.eps / threeYearsAgo.eps) ** (1/3) - 1) * 100;
      }
    }

    return {
      incomeStatements,
      balanceSheets,
      cashFlows,
      keyMetrics: {
        grossMargin: latestRatios?.grossProfitMargin ? latestRatios.grossProfitMargin * 100 : null,
        operatingMargin: latestRatios?.operatingProfitMargin ? latestRatios.operatingProfitMargin * 100 : null,
        netMargin: latestRatios?.netProfitMargin ? latestRatios.netProfitMargin * 100 : null,
        roe: latestRatios?.returnOnEquity ? latestRatios.returnOnEquity * 100 : null,
        roa: latestRatios?.returnOnAssets ? latestRatios.returnOnAssets * 100 : null,
        revenueGrowth3Y,
        epsGrowth3Y,
      },
    };
  } catch (e) {
    console.error('FMP financials error:', e);
    return await fetchFinnhubFinancialData(symbol);
  }
}

async function fetchFinnhubFinancialData(symbol: string): Promise<FinancialStatements | null> {
  if (!FINNHUB_API_KEY) return null;

  try {
    const url = `https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();
    const metric = data.metric;

    if (!metric) return null;

    // Finnhub provides limited financial data through metrics endpoint
    return {
      incomeStatements: [],
      balanceSheets: [],
      cashFlows: [],
      keyMetrics: {
        grossMargin: metric.grossMarginTTM ?? metric.grossMarginAnnual ?? null,
        operatingMargin: metric.operatingMarginTTM ?? metric.operatingMarginAnnual ?? null,
        netMargin: metric.netProfitMarginTTM ?? metric.netProfitMarginAnnual ?? null,
        roe: metric.roeTTM ?? metric.roeAnnual ?? null,
        roa: metric.roaTTM ?? metric.roaAnnual ?? null,
        revenueGrowth3Y: metric.revenueGrowth3Y ?? null,
        epsGrowth3Y: metric.epsGrowth3Y ?? null,
      },
    };
  } catch (e) {
    console.error('Finnhub financials error:', e);
    return null;
  }
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
