import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTrendingStocks, type TrendingStock } from '../stockAnalyzer.api';

export function TrendingPage() {
  const [stocks, setStocks] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchTrendingStocks();
        if (mounted) {
          setStocks(data);
          setError(data.length === 0);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
    return vol.toString();
  };

  const handleAnalyze = (symbol: string) => {
    navigate(`/?symbol=${encodeURIComponent(symbol)}`);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-300">Chargement des actions trending...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-6xl mb-4">😕</p>
        <p className="text-slate-400">
          Impossible de charger les actions du moment
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🇺🇸 Trending US</h1>
        <p className="text-slate-400">
          Les actions les plus tendance aux États-Unis
        </p>
      </div>

      <div className="grid gap-4">
        {stocks.map((stock, index) => (
          <div
            key={stock.symbol}
            className="bg-slate-800 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full text-sm font-bold text-slate-400">
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-400">
                  {stock.symbol}
                </span>
                <span
                  className={`text-sm font-medium px-2 py-0.5 rounded ${
                    stock.changePercent >= 0
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}
                >
                  {stock.changePercent >= 0 ? '+' : ''}
                  {stock.changePercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-sm text-slate-400 truncate">{stock.name}</p>
            </div>

            <div className="text-right hidden sm:block">
              <p className="font-semibold text-white">
                ${stock.price.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">
                Vol: {formatVolume(stock.volume)}
              </p>
            </div>

            <button
              onClick={() => handleAnalyze(stock.symbol)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Analyser
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Données fournies par{' '}
          <a
            href="https://finance.yahoo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Yahoo Finance
          </a>
        </p>
      </div>
    </div>
  );
}
