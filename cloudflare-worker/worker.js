/**
 * Cloudflare Worker - Yahoo Finance Proxy
 *
 * Deploy with:
 * 1. Go to https://dash.cloudflare.com/
 * 2. Workers & Pages > Create Worker
 * 3. Copy this code and deploy
 * 4. Note your worker URL (e.g., https://yahoo-proxy.your-account.workers.dev)
 */

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://stock-analyzer-gilt-eta.vercel.app'
];

const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }

    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // Only allow specific origins
    if (!ALLOWED_ORIGINS.includes(origin) && !origin.includes('localhost')) {
      return new Response('Forbidden', { status: 403 });
    }

    // Get the Yahoo Finance path from the request
    // Expected format: /v8/finance/chart/AAPL?interval=1d&range=1d
    const yahooPath = url.pathname + url.search;

    if (!yahooPath.startsWith('/v')) {
      return new Response('Invalid path. Use /v8/finance/chart/{symbol}', {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    try {
      // Fetch from Yahoo Finance
      const yahooResponse = await fetch(YAHOO_BASE_URL + yahooPath, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      // Clone the response and add CORS headers
      const responseBody = await yahooResponse.text();

      return new Response(responseBody, {
        status: yahooResponse.status,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json',
        },
      });
    }
  },
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function handleCORS(request) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
