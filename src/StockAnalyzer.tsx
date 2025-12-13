import { useStockSearch } from './useStockSearch';
import { useStockAnalysis } from './useStockAnalysis';
import { getCurrencySymbol, getVerdictStyle } from './stockAnalyzer.utils';

export function StockAnalyzer() {
  const {
    loading,
    progress,
    error,
    analysis,
    analyze,
    clearAnalysis,
    clearError,
  } = useStockAnalysis();

  const {
    query,
    setQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectedStock,
    searchLoading,
    inputRef,
    suggestionsRef,
    handleSelect,
    handleClear: searchClear,
  } = useStockSearch(() => {
    clearAnalysis();
    clearError();
  });

  const handleClear = () => {
    searchClear();
  };

  const handleAnalyze = () => {
    setShowSuggestions(false);
    analyze(query, selectedStock);
  };

  const cs = (currency: string) => getCurrencySymbol(currency);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">📊 Analyseur Boursier</h1>
          <p className="text-slate-400">
            Analyse technique pour investissement long terme
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  clearError();
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAnalyze();
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
                placeholder="Rechercher (ex: Apple, LVMH, Tesla, THEON...)"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-lg pr-10"
                disabled={loading}
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {query && !loading && !searchLoading && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? '⏳' : '🔍'} Analyser
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-72 overflow-y-auto"
            >
              {suggestions.map((s, i) => (
                <button
                  key={`${s.symbol}-${i}`}
                  onClick={() => handleSelect(s)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-700 flex justify-between border-b border-slate-700/50 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-blue-400">{s.symbol}</span>
                    <p className="text-sm text-slate-400 truncate">{s.name}</p>
                  </div>
                  <div className="text-right text-sm ml-4 flex-shrink-0">
                    <div className="text-slate-300">{s.region}</div>
                    <div className="text-slate-500">{s.currency}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-300">{progress}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">❌ {error}</p>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Header + Verdict */}
            <div className="bg-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{analysis.stock.name}</h2>
                  <p className="text-slate-400">
                    {analysis.stock.ticker} • {analysis.stock.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {cs(analysis.stock.currency)}
                    {analysis.stock.price.toFixed(2)}
                  </p>
                  <p
                    className={
                      analysis.stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }
                  >
                    {analysis.stock.change >= 0 ? '+' : ''}
                    {analysis.stock.change.toFixed(2)} (
                    {analysis.stock.changePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
              <div
                className={`rounded-lg p-5 text-center border-2 ${getVerdictStyle(analysis.analysis.verdict)}`}
              >
                <div className="text-5xl mb-2">{analysis.analysis.emoji}</div>
                <h3 className="text-2xl font-bold">{analysis.analysis.verdict}</h3>
                <p className="text-slate-400 mt-1">
                  Score: {analysis.analysis.score} points
                </p>
                <p className="text-slate-300 mt-3 text-sm">
                  {analysis.analysis.summary}
                </p>
              </div>
            </div>

            {/* Indicateurs */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">
                📈 Indicateurs Techniques
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'MM200',
                    value: `${cs(analysis.stock.currency)}${analysis.indicators.mm200.toFixed(2)}`,
                    sub: analysis.indicators.priceAboveMM200
                      ? '↑ Au-dessus'
                      : '↓ En dessous',
                    color: analysis.indicators.priceAboveMM200
                      ? 'text-green-400'
                      : 'text-red-400',
                  },
                  {
                    label: 'RSI (14)',
                    value: analysis.indicators.rsi.toFixed(1),
                    sub:
                      analysis.indicators.rsi > 70
                        ? 'Surachat'
                        : analysis.indicators.rsi > 50
                          ? 'Achat'
                          : analysis.indicators.rsi > 30
                            ? 'Neutre'
                            : 'Survente',
                    color:
                      analysis.indicators.rsi > 70
                        ? 'text-red-400'
                        : analysis.indicators.rsi > 50
                          ? 'text-green-400'
                          : analysis.indicators.rsi > 30
                            ? 'text-yellow-400'
                            : 'text-blue-400',
                  },
                  {
                    label: 'MACD',
                    value: analysis.indicators.macd.toFixed(3),
                    sub:
                      analysis.indicators.macd > analysis.indicators.macdSignal
                        ? '↑ Haussier'
                        : '↓ Baissier',
                    color:
                      analysis.indicators.macd > analysis.indicators.macdSignal
                        ? 'text-green-400'
                        : 'text-red-400',
                  },
                  {
                    label: 'ATR (14)',
                    value: `${cs(analysis.stock.currency)}${analysis.indicators.atr.toFixed(2)}`,
                    sub: `${((analysis.indicators.atr / analysis.stock.price) * 100).toFixed(1)}% vol.`,
                    color: 'text-slate-400',
                  },
                ].map((ind) => (
                  <div key={ind.label} className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">{ind.label}</p>
                    <p className="text-xl font-semibold">{ind.value}</p>
                    <p className={`text-sm ${ind.color}`}>{ind.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Détails */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">🔍 Analyse Détaillée</h3>
              {analysis.analysis.positives.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-green-400 font-medium mb-2">
                    ✅ Points positifs
                  </h4>
                  {analysis.analysis.positives.map((p, i) => (
                    <p key={i} className="text-slate-300 text-sm pl-4">
                      • {p}
                    </p>
                  ))}
                </div>
              )}
              {analysis.analysis.warnings.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-yellow-400 font-medium mb-2">
                    ⚠️ Points d'attention
                  </h4>
                  {analysis.analysis.warnings.map((w, i) => (
                    <p key={i} className="text-slate-300 text-sm pl-4">
                      • {w}
                    </p>
                  ))}
                </div>
              )}
              {analysis.analysis.negatives.length > 0 && (
                <div>
                  <h4 className="text-red-400 font-medium mb-2">
                    ❌ Points négatifs
                  </h4>
                  {analysis.analysis.negatives.map((n, i) => (
                    <p key={i} className="text-slate-300 text-sm pl-4">
                      • {n}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Stop Loss + Actions */}
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-sm">
                💡 Stop-loss suggéré (2×ATR) :{' '}
                <span className="text-white font-medium">
                  {cs(analysis.stock.currency)}
                  {(analysis.stock.price - 2 * analysis.indicators.atr).toFixed(2)}
                </span>
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={handleClear}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
              >
                🔄 Nouvelle analyse
              </button>
            </div>

            <p className="text-slate-500 text-xs text-center">
              ⚠️ Ceci n'est pas un conseil en investissement.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !analysis && !error && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-6xl mb-4">📈</p>
            <p className="text-lg">Recherchez une action pour lancer l'analyse</p>
            <p className="text-sm mt-2">Tapez le nom ou le ticker</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['Apple', 'LVMH', 'Tesla', 'THEON', 'Airbus'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setQuery(ex)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-sm"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
