// In development, use Vite proxy. In production, use Cloudflare Worker or CORS proxies.
const isDev = import.meta.env.DEV;

// Set your Cloudflare Worker URL here after deployment (leave empty to use public proxies)
const CLOUDFLARE_WORKER_URL = 'https://stock-analyzer.valentin-harrang-dev.workers.dev';

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

let currentProxyIndex = 0;

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEY_PREFIX = 'stock_price_';

interface CachedPrice {
  data: StockPrice;
  timestamp: number;
}

function getCachedPrice(symbol: string): StockPrice | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + symbol);
    if (!cached) return null;

    const parsed: CachedPrice = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    if (age < CACHE_TTL_MS) {
      return parsed.data;
    }

    // Expired - remove from cache
    localStorage.removeItem(CACHE_KEY_PREFIX + symbol);
    return null;
  } catch {
    return null;
  }
}

function setCachedPrice(symbol: string, data: StockPrice): void {
  try {
    const cached: CachedPrice = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY_PREFIX + symbol, JSON.stringify(cached));
  } catch {
    // localStorage full or unavailable - ignore
  }
}

function buildYahooUrl(symbol: string): string {
  const path = `/v8/finance/chart/${symbol}?interval=1d&range=1d`;

  // Development: use Vite proxy
  if (isDev) {
    return `/api/yahoo${path}`;
  }

  // Production: prefer Cloudflare Worker if configured
  if (CLOUDFLARE_WORKER_URL) {
    return `${CLOUDFLARE_WORKER_URL}${path}`;
  }

  // Fallback: public CORS proxies
  const proxy = CORS_PROXIES[currentProxyIndex];
  return proxy + encodeURIComponent(`https://query1.finance.yahoo.com${path}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(symbol: string, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const url = buildYahooUrl(symbol);
    const response = await fetch(url);

    if (response.ok) {
      return response;
    }

    if (response.status === 429) {
      // Rate limited - wait with exponential backoff
      const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      console.log(`Rate limited for ${symbol}, waiting ${waitTime}ms...`);
      await sleep(waitTime);

      // Try next proxy in production
      if (!isDev) {
        currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
      }
      continue;
    }

    // Other errors - try next proxy in production
    if (!isDev) {
      currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
    }
  }

  throw new Error(`Failed to fetch ${symbol} after ${retries} retries`);
}

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

export async function fetchStockPrice(symbol: string): Promise<StockPrice | null> {
  // Check cache first
  const cached = getCachedPrice(symbol);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetchWithRetry(symbol);
    const data = await response.json();

    const meta = data.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const previousClose = meta.chartPreviousClose || meta.previousClose || 0;
    const currentPrice = meta.regularMarketPrice || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    const result: StockPrice = {
      symbol: meta.symbol,
      price: currentPrice,
      change,
      changePercent,
      currency: meta.currency || 'EUR',
    };

    // Cache the result
    setCachedPrice(symbol, result);

    return result;
  } catch (e) {
    console.error(`Error fetching ${symbol}:`, e);
    return null;
  }
}

export async function fetchMultipleStockPrices(
  symbols: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<Map<string, StockPrice>> {
  const results = new Map<string, StockPrice>();
  const symbolsToFetch: string[] = [];

  // First pass: get cached prices
  for (const symbol of symbols) {
    const cached = getCachedPrice(symbol);
    if (cached) {
      results.set(symbol, cached);
    } else {
      symbolsToFetch.push(symbol);
    }
  }

  // Report cached progress immediately
  onProgress?.(results.size, symbols.length);

  // Second pass: fetch missing prices sequentially
  for (let i = 0; i < symbolsToFetch.length; i++) {
    const symbol = symbolsToFetch[i];
    const price = await fetchStockPrice(symbol);

    if (price) {
      results.set(symbol, price);
    }

    onProgress?.(results.size, symbols.length);

    // Delay between each request (300ms) to avoid 429
    if (i < symbolsToFetch.length - 1) {
      await sleep(300);
    }
  }

  return results;
}
