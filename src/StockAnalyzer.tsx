import { useEffect, useRef } from 'react';
import { useQueryState } from 'nuqs';
import { useStockSearch } from './useStockSearch';
import { useStockAnalysis } from './useStockAnalysis';
import { getCurrencySymbol, getVerdictStyle, getValuationVerdictStyle, getMM200SlopeLabel, interpretTechnicalIndicators } from './stockAnalyzer.utils';
import { StockChart } from './components/StockChart';
import { DividendSection } from './components/DividendSection';
import { FinancialsSection } from './components/FinancialsSection';

export function StockAnalyzer() {
  const [symbolParam, setSymbolParam] = useQueryState('symbol');
  const hasInitialized = useRef(false);

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
    setQueryWithoutSearch,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    searchLoading,
    inputRef,
    suggestionsRef,
    handleSelect,
    handleClear: searchClear,
    resetForNewSearch,
  } = useStockSearch({
    onClear: () => {
      clearAnalysis();
      clearError();
    },
    onSelect: (stock) => {
      // Lancer l'analyse automatiquement à la sélection
      analyze(stock.symbol, stock);
    },
  });

  // Handle symbol from URL on initial load
  useEffect(() => {
    if (symbolParam && !hasInitialized.current && !loading) {
      hasInitialized.current = true;
      setQueryWithoutSearch(symbolParam);
      analyze(symbolParam, null);
    }
  }, [symbolParam, loading, setQueryWithoutSearch, analyze]);

  // Update URL when analysis completes
  useEffect(() => {
    if (analysis?.stock.ticker) {
      setSymbolParam(analysis.stock.ticker);
    }
  }, [analysis?.stock.ticker, setSymbolParam]);

  const handleClear = () => {
    searchClear();
    setSymbolParam(null);
  };

  const cs = (currency: string) => getCurrencySymbol(currency);

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">📊 Analyseur Boursier</h1>
        <p className="text-slate-400">
          Analyse technique pour investissement long terme
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              clearError();
              // Permettre une nouvelle recherche si l'utilisateur modifie le texte
              resetForNewSearch();
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowSuggestions(false);
            }}
            placeholder="Rechercher une action (ex: Apple, LVMH, Tesla, ...)"
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

          {/* Graphique */}
          <StockChart
            data={analysis.chartData}
            mm200={analysis.indicators.mm200}
            currency={analysis.stock.currency}
          />

          {/* Indicateurs Techniques */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">
              📈 Indicateurs Techniques
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
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

            {/* MM200 Analysis */}
            <div className="mt-4 bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-3">Moyenne Mobile 200 jours</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* MM200 Value + Position */}
                <div>
                  <p className="text-xl font-semibold">
                    {cs(analysis.stock.currency)}{analysis.indicators.mm200.toFixed(2)}
                  </p>
                  <p className={`text-sm ${analysis.indicators.priceAboveMM200 ? 'text-green-400' : 'text-red-400'}`}>
                    {analysis.indicators.priceAboveMM200 ? '↑ Cours au-dessus' : '↓ Cours en dessous'}
                    {' '}({analysis.indicators.mm200Analysis.distancePercent >= 0 ? '+' : ''}{analysis.indicators.mm200Analysis.distancePercent.toFixed(1)}%)
                  </p>
                </div>

                {/* MM200 Slope */}
                <div>
                  {(() => {
                    const slopeInfo = getMM200SlopeLabel(analysis.indicators.mm200Analysis.slope);
                    return (
                      <>
                        <p className="text-xl font-semibold">
                          {slopeInfo.emoji} {slopeInfo.label}
                        </p>
                        <p className={`text-sm ${slopeInfo.color}`}>
                          Pente: {analysis.indicators.mm200Analysis.slopePercent >= 0 ? '+' : ''}{analysis.indicators.mm200Analysis.slopePercent.toFixed(2)}% / 20j
                        </p>
                      </>
                    );
                  })()}
                </div>

                {/* Consolidation */}
                <div>
                  {analysis.indicators.consolidation.isConsolidating ? (
                    <>
                      <p className="text-xl font-semibold text-yellow-400">
                        📊 Consolidation
                      </p>
                      <p className="text-sm text-yellow-400">
                        {analysis.indicators.consolidation.days} jours (range {analysis.indicators.consolidation.rangePercent.toFixed(1)}%)
                      </p>
                    </>
                  ) : analysis.indicators.consolidation.days > 0 ? (
                    <>
                      <p className="text-xl font-semibold text-slate-300">
                        📊 Range court
                      </p>
                      <p className="text-sm text-slate-400">
                        {analysis.indicators.consolidation.days} jours (range {analysis.indicators.consolidation.rangePercent.toFixed(1)}%)
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-semibold text-blue-400">
                        📈 En tendance
                      </p>
                      <p className="text-sm text-slate-400">
                        Pas de consolidation détectée
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Interprétation automatique */}
            {(() => {
              const interpretation = interpretTechnicalIndicators(analysis.indicators, analysis.stock);
              return (
                <div className="mt-4 bg-slate-700/30 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Tendance */}
                    <div className="text-center">
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Tendance</p>
                      <p className={`text-lg font-semibold ${
                        interpretation.trend.status === 'bullish' ? 'text-green-400' :
                        interpretation.trend.status === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {interpretation.trend.status === 'bullish' ? '📈' : interpretation.trend.status === 'bearish' ? '📉' : '➡️'} {interpretation.trend.label}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">{interpretation.trend.description}</p>
                    </div>

                    {/* Momentum */}
                    <div className="text-center">
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Momentum</p>
                      <p className={`text-lg font-semibold ${
                        interpretation.momentum.status === 'strong' ? 'text-green-400' :
                        interpretation.momentum.status === 'weak' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {interpretation.momentum.status === 'strong' ? '💪' : interpretation.momentum.status === 'weak' ? '📉' : '⚖️'} {interpretation.momentum.label}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">{interpretation.momentum.description}</p>
                    </div>

                    {/* Signal */}
                    <div className="text-center">
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Signal Technique</p>
                      <p className={`text-lg font-semibold ${
                        interpretation.signal.action === 'buy' ? 'text-green-400' :
                        interpretation.signal.action === 'sell' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {interpretation.signal.action === 'buy' ? '✅' : interpretation.signal.action === 'sell' ? '⛔' : '⏸️'} {interpretation.signal.label}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Confiance: {interpretation.signal.confidence === 'high' ? 'Élevée' : interpretation.signal.confidence === 'medium' ? 'Moyenne' : 'Faible'}
                      </p>
                    </div>
                  </div>

                  {/* Points clés */}
                  {interpretation.keyPoints.length > 0 && (
                    <div className="border-t border-slate-600/50 pt-3 mt-3">
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Points clés</p>
                      <ul className="space-y-1">
                        {interpretation.keyPoints.map((point, i) => (
                          <li key={i} className="text-slate-300 text-sm">• {point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Valorisation */}
          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-400">
                💰 Valorisation
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getValuationVerdictStyle(analysis.valuationVerdict.status)}`}
              >
                {analysis.valuationVerdict.emoji} {analysis.valuationVerdict.status}
              </span>
            </div>

            {/* Ratios fondamentaux - seulement si des données sont disponibles */}
            {(analysis.valuation.trailingPE || analysis.valuation.pegRatio || analysis.valuation.priceToBook) ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {analysis.valuation.trailingPE && (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">P/E Ratio</p>
                    <p className="text-xl font-semibold">{analysis.valuation.trailingPE.toFixed(1)}</p>
                    <p className={`text-sm ${
                      analysis.valuation.trailingPE < 15 ? 'text-green-400' :
                      analysis.valuation.trailingPE < 25 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {analysis.valuation.trailingPE < 15 ? 'Attractif' :
                       analysis.valuation.trailingPE < 25 ? 'Modéré' : 'Élevé'}
                    </p>
                  </div>
                )}
                {analysis.valuation.pegRatio && (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">PEG Ratio</p>
                    <p className="text-xl font-semibold">{analysis.valuation.pegRatio.toFixed(2)}</p>
                    <p className={`text-sm ${
                      analysis.valuation.pegRatio < 1 ? 'text-green-400' :
                      analysis.valuation.pegRatio < 1.5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {analysis.valuation.pegRatio < 1 ? 'Sous-évalué' :
                       analysis.valuation.pegRatio < 1.5 ? 'Juste valeur' : 'Surévalué'}
                    </p>
                  </div>
                )}
                {analysis.valuation.priceToBook && (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Price/Book</p>
                    <p className="text-xl font-semibold">{analysis.valuation.priceToBook.toFixed(2)}</p>
                    <p className={`text-sm ${
                      analysis.valuation.priceToBook < 1 ? 'text-green-400' :
                      analysis.valuation.priceToBook < 3 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {analysis.valuation.priceToBook < 1 ? 'Sous la valeur' :
                       analysis.valuation.priceToBook < 3 ? 'Normal' : 'Prime élevée'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-700/30 rounded-lg p-4 mb-4 text-center">
                <p className="text-slate-400 text-sm">
                  📊 Ratios fondamentaux non disponibles pour cette action
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Les données P/E, PEG et P/B ne sont pas disponibles via les APIs gratuites pour les marchés européens
                </p>
              </div>
            )}

            {/* 52 Week Range */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-2">Position sur 52 semaines</p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400 w-20">
                  {cs(analysis.stock.currency)}{analysis.valuation.fiftyTwoWeekLow.toFixed(2)}
                </span>
                <div className="flex-1 relative h-2 bg-slate-600 rounded-full">
                  {(() => {
                    const range = analysis.valuation.fiftyTwoWeekHigh - analysis.valuation.fiftyTwoWeekLow;
                    const position = range > 0
                      ? ((analysis.valuation.currentPrice - analysis.valuation.fiftyTwoWeekLow) / range) * 100
                      : 50;
                    return (
                      <>
                        <div
                          className="absolute h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, position))}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border-2 border-blue-500"
                          style={{ left: `calc(${Math.min(100, Math.max(0, position))}% - 6px)` }}
                        />
                      </>
                    );
                  })()}
                </div>
                <span className="text-sm text-slate-400 w-20 text-right">
                  {cs(analysis.stock.currency)}{analysis.valuation.fiftyTwoWeekHigh.toFixed(2)}
                </span>
              </div>
              <p className="text-center text-sm text-slate-300 mt-2">
                {(() => {
                  const range = analysis.valuation.fiftyTwoWeekHigh - analysis.valuation.fiftyTwoWeekLow;
                  const position = range > 0
                    ? ((analysis.valuation.currentPrice - analysis.valuation.fiftyTwoWeekLow) / range) * 100
                    : 50;
                  return `${position.toFixed(0)}% du range annuel`;
                })()}
              </p>
            </div>

            {/* Explication du verdict */}
            <p className="text-slate-400 text-sm mt-4 text-center">
              {analysis.valuationVerdict.explanation}
            </p>
          </div>

          {/* Dividendes */}
          <DividendSection
            dividend={analysis.dividend}
            currencySymbol={cs(analysis.stock.currency)}
          />

          {/* États Financiers */}
          <FinancialsSection
            financials={analysis.financials}
            currencySymbol={cs(analysis.stock.currency)}
          />

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
            {['Apple', 'LVMH', 'Tesla', 'Airbus'].map((ex) => (
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
  );
}
