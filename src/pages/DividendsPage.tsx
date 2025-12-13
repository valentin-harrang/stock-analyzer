import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EU_DIVIDEND_STOCKS, type StockListItem } from '../data/stockLists';
import { fetchMultipleStockPrices } from '../utils/fetchStockPrice';

interface StockWithPrice extends StockListItem {
  price?: number;
  change?: number;
  changePercent?: number;
  loading: boolean;
}

export function DividendsPage() {
  const [stocks, setStocks] = useState<StockWithPrice[]>(
    EU_DIVIDEND_STOCKS.map((s) => ({ ...s, loading: true }))
  );
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPrices() {
      const symbols = EU_DIVIDEND_STOCKS.map((s) => s.symbol);
      const pricesMap = await fetchMultipleStockPrices(symbols, (loaded) => {
        setStocks((prev) =>
          prev.map((stock, idx) => ({
            ...stock,
            loading: idx >= loaded,
          }))
        );
      });

      setStocks(
        EU_DIVIDEND_STOCKS.map((stock) => {
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

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🇪🇺 Dividendes Europe</h1>
        <p className="text-slate-400">
          Les meilleures actions à dividendes européennes
        </p>
      </div>

      <div className="grid gap-3">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className="bg-slate-800 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-blue-400">
                  {stock.symbol.replace('.PA', '').replace('.DE', '').replace('.AS', '').replace('.MC', '').replace('.MI', '')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-green-900/50 text-green-400">
                  {stock.dividendYield}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                  {stock.sector}
                </span>
              </div>
              <p className="text-sm text-slate-400 truncate">{stock.name}</p>
            </div>

            <div className="text-right hidden sm:block">
              {stock.loading ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : stock.price ? (
                <>
                  <p className="font-semibold text-white">
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
                <span className="text-slate-500">-</span>
              )}
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

      <div className="mt-8 p-4 bg-slate-800/50 rounded-xl">
        <p className="text-slate-400 text-sm text-center">
          💡 Les rendements affichés sont indicatifs et basés sur les dividendes
          des 12 derniers mois. Ils peuvent varier.
        </p>
      </div>
    </div>
  );
}
