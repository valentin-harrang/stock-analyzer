import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAC40_STOCKS, type StockListItem } from '../data/stockLists';
import { fetchMultipleStockPrices } from '../utils/fetchStockPrice';

interface StockWithPrice extends StockListItem {
  price?: number;
  change?: number;
  changePercent?: number;
  loading: boolean;
}

export function Cac40Page() {
  const [stocks, setStocks] = useState<StockWithPrice[]>(
    CAC40_STOCKS.map((s) => ({ ...s, loading: true }))
  );
  const [sortBy, setSortBy] = useState<'name' | 'perf'>('name');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPrices() {
      const symbols = CAC40_STOCKS.map((s) => s.symbol);
      const pricesMap = await fetchMultipleStockPrices(symbols, (loaded) => {
        // Update loading progress
        setStocks((prev) =>
          prev.map((stock, idx) => ({
            ...stock,
            loading: idx >= loaded,
          }))
        );
      });

      setStocks(
        CAC40_STOCKS.map((stock) => {
          const priceData = pricesMap.get(stock.symbol);
          if (priceData) {
            return {
              ...stock,
              price: priceData.price,
              change: priceData.change,
              changePercent: priceData.changePercent,
              loading: false,
            };
          }
          return { ...stock, loading: false };
        })
      );
    }

    fetchPrices();
  }, []);

  const handleAnalyze = (symbol: string) => {
    navigate(`/?symbol=${encodeURIComponent(symbol)}`);
  };

  const sortedStocks = [...stocks].sort((a, b) => {
    if (sortBy === 'perf') {
      return (b.changePercent || 0) - (a.changePercent || 0);
    }
    return a.name.localeCompare(b.name);
  });

  const loadingCount = stocks.filter((s) => s.loading).length;
  const avgChange =
    stocks.filter((s) => !s.loading && s.changePercent !== undefined).length > 0
      ? stocks
          .filter((s) => !s.loading && s.changePercent !== undefined)
          .reduce((acc, s) => acc + (s.changePercent || 0), 0) /
        stocks.filter((s) => !s.loading && s.changePercent !== undefined).length
      : 0;

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🇫🇷 CAC 40</h1>
        <p className="text-slate-400">
          Les 40 plus grandes entreprises françaises
        </p>
        {loadingCount === 0 && (
          <p
            className={`text-sm mt-2 ${
              avgChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            Moyenne du jour : {avgChange >= 0 ? '+' : ''}
            {avgChange.toFixed(2)}%
          </p>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('name')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'name'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            A-Z
          </button>
          <button
            onClick={() => setSortBy('perf')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'perf'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            Performance
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        {sortedStocks.map((stock) => (
          <div
            key={stock.symbol}
            className="bg-slate-800 rounded-lg p-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-400 text-sm">
                  {stock.symbol.replace('.PA', '').replace('.AS', '')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                  {stock.sector}
                </span>
              </div>
              <p className="text-sm text-slate-400 truncate">{stock.name}</p>
            </div>

            <div className="text-right">
              {stock.loading ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : stock.price ? (
                <>
                  <p className="font-semibold text-white text-sm">
                    €{stock.price.toFixed(2)}
                  </p>
                  <p
                    className={`text-xs ${
                      (stock.changePercent || 0) >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {(stock.changePercent || 0) >= 0 ? '+' : ''}
                    {stock.changePercent?.toFixed(2)}%
                  </p>
                </>
              ) : (
                <span className="text-slate-500 text-sm">-</span>
              )}
            </div>

            <button
              onClick={() => handleAnalyze(stock.symbol)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors"
            >
              Analyser
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
