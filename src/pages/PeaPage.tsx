import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PEA_STOCKS, type StockListItem } from '../data/stockLists';
import { fetchMultipleStockPrices } from '../utils/fetchStockPrice';

interface StockWithPrice extends StockListItem {
  price?: number;
  change?: number;
  changePercent?: number;
  loading: boolean;
}

export function PeaPage() {
  const [stocks, setStocks] = useState<StockWithPrice[]>(
    PEA_STOCKS.map((s) => ({ ...s, loading: true }))
  );
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPrices() {
      const symbols = PEA_STOCKS.map((s) => s.symbol);
      const pricesMap = await fetchMultipleStockPrices(symbols, (loaded, total) => {
        setStocks((prev) =>
          prev.map((stock, idx) => ({
            ...stock,
            loading: idx >= loaded,
          }))
        );
      });

      setStocks(
        PEA_STOCKS.map((stock) => {
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

  const actions = stocks.filter((s) => !s.sector.startsWith('ETF'));
  const etfs = stocks.filter((s) => s.sector.startsWith('ETF'));

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">💰 PEA</h1>
        <p className="text-slate-400">
          Sélection d'actions et ETF éligibles au PEA
        </p>
      </div>

      <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 mb-8">
        <h3 className="font-semibold text-blue-400 mb-2">
          💡 Avantages du PEA
        </h3>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• Exonération d'impôt sur les plus-values après 5 ans</li>
          <li>• Prélèvements sociaux de 17.2% uniquement (vs 30% flat tax)</li>
          <li>• Plafond de versement : 150 000€</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-300 mb-4">
          📈 Actions recommandées
        </h2>
        <div className="grid gap-2">
          {actions.map((stock) => (
            <div
              key={stock.symbol}
              className="bg-slate-800 rounded-lg p-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-400 text-sm">
                    {stock.symbol.replace('.PA', '')}
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

      {/* ETFs */}
      <div>
        <h2 className="text-xl font-semibold text-slate-300 mb-4">
          📊 ETF éligibles PEA
        </h2>
        <div className="grid gap-2">
          {etfs.map((stock) => (
            <div
              key={stock.symbol}
              className="bg-slate-800 rounded-lg p-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-400 text-sm">
                    {stock.symbol.replace('.PA', '')}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-900/50 text-purple-400">
                    {stock.sector}
                  </span>
                </div>
                <p className="text-sm text-slate-400 truncate">{stock.name}</p>
              </div>

              <div className="text-right">
                {stock.loading ? (
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-medium transition-colors"
              >
                Analyser
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 bg-slate-800/50 rounded-xl">
        <p className="text-slate-400 text-sm text-center">
          ⚠️ Cette liste est une sélection personnelle et ne constitue pas un
          conseil en investissement.
        </p>
      </div>
    </div>
  );
}
