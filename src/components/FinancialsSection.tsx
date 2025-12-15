import type { FinancialStatements } from '../stockAnalyzer.types';

interface FinancialsSectionProps {
  financials: FinancialStatements | null;
  currencySymbol: string;
}

function formatLargeNumber(num: number): string {
  const absNum = Math.abs(num);
  if (absNum >= 1e12) {
    return `${(num / 1e12).toFixed(1)}T`;
  }
  if (absNum >= 1e9) {
    return `${(num / 1e9).toFixed(1)}Md`;
  }
  if (absNum >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`;
  }
  if (absNum >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  }
  return num.toFixed(0);
}

function getMetricColor(value: number | null, thresholds: { good: number; warning: number; isInverse?: boolean }): string {
  if (value === null) return 'text-slate-400';

  if (thresholds.isInverse) {
    // Pour les métriques où plus bas = mieux (ex: dette)
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  }

  // Pour les métriques où plus haut = mieux
  if (value >= thresholds.good) return 'text-green-400';
  if (value >= thresholds.warning) return 'text-yellow-400';
  return 'text-red-400';
}

function getGrowthColor(value: number | null): string {
  if (value === null) return 'text-slate-400';
  if (value > 10) return 'text-green-400';
  if (value > 0) return 'text-yellow-400';
  return 'text-red-400';
}

export function FinancialsSection({ financials, currencySymbol }: FinancialsSectionProps) {
  if (!financials) {
    return (
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-400">
          📊 États Financiers
        </h3>
        <div className="bg-slate-700/30 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-sm">
            États financiers non disponibles pour cette action
          </p>
        </div>
      </div>
    );
  }

  const { keyMetrics, incomeStatements, balanceSheets, cashFlows } = financials;
  const hasDetailedData = incomeStatements.length > 0;

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-blue-400">
        📊 États Financiers
      </h3>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Marge brute */}
        {keyMetrics.grossMargin !== null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Marge brute</p>
            <p className={`text-xl font-semibold ${getMetricColor(keyMetrics.grossMargin, { good: 40, warning: 20 })}`}>
              {keyMetrics.grossMargin.toFixed(1)}%
            </p>
          </div>
        )}

        {/* Marge opérationnelle */}
        {keyMetrics.operatingMargin !== null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Marge opérationnelle</p>
            <p className={`text-xl font-semibold ${getMetricColor(keyMetrics.operatingMargin, { good: 15, warning: 5 })}`}>
              {keyMetrics.operatingMargin.toFixed(1)}%
            </p>
          </div>
        )}

        {/* Marge nette */}
        {keyMetrics.netMargin !== null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Marge nette</p>
            <p className={`text-xl font-semibold ${getMetricColor(keyMetrics.netMargin, { good: 10, warning: 3 })}`}>
              {keyMetrics.netMargin.toFixed(1)}%
            </p>
          </div>
        )}

        {/* ROE */}
        {keyMetrics.roe !== null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">ROE</p>
            <p className={`text-xl font-semibold ${getMetricColor(keyMetrics.roe, { good: 15, warning: 8 })}`}>
              {keyMetrics.roe.toFixed(1)}%
            </p>
            <p className="text-slate-500 text-xs mt-1">Rentabilité capitaux propres</p>
          </div>
        )}

        {/* ROA */}
        {keyMetrics.roa !== null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">ROA</p>
            <p className={`text-xl font-semibold ${getMetricColor(keyMetrics.roa, { good: 8, warning: 3 })}`}>
              {keyMetrics.roa.toFixed(1)}%
            </p>
            <p className="text-slate-500 text-xs mt-1">Rentabilité des actifs</p>
          </div>
        )}

        {/* Croissance CA 3 ans */}
        {keyMetrics.revenueGrowth3Y !== null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Croissance CA 3 ans</p>
            <p className={`text-xl font-semibold ${getGrowthColor(keyMetrics.revenueGrowth3Y)}`}>
              {keyMetrics.revenueGrowth3Y >= 0 ? '+' : ''}{keyMetrics.revenueGrowth3Y.toFixed(1)}%
            </p>
            <p className="text-slate-500 text-xs mt-1">par an (CAGR)</p>
          </div>
        )}

        {/* Croissance BPA 3 ans */}
        {keyMetrics.epsGrowth3Y !== null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Croissance BPA 3 ans</p>
            <p className={`text-xl font-semibold ${getGrowthColor(keyMetrics.epsGrowth3Y)}`}>
              {keyMetrics.epsGrowth3Y >= 0 ? '+' : ''}{keyMetrics.epsGrowth3Y.toFixed(1)}%
            </p>
            <p className="text-slate-500 text-xs mt-1">par an (CAGR)</p>
          </div>
        )}
      </div>

      {/* Detailed Financial Statements */}
      {hasDetailedData && (
        <>
          {/* Income Statement Summary */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-slate-300 mb-3">Compte de résultat (5 dernières années)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-2 px-2">Année</th>
                    <th className="text-right py-2 px-2">Chiffre d'affaires</th>
                    <th className="text-right py-2 px-2">Croissance</th>
                    <th className="text-right py-2 px-2">Résultat net</th>
                    <th className="text-right py-2 px-2">BPA</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeStatements.slice(0, 5).map((is) => (
                    <tr key={is.year} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-2 px-2 font-medium">{is.year}</td>
                      <td className="text-right py-2 px-2">{currencySymbol}{formatLargeNumber(is.revenue)}</td>
                      <td className={`text-right py-2 px-2 ${is.revenueGrowth !== null ? getGrowthColor(is.revenueGrowth) : 'text-slate-500'}`}>
                        {is.revenueGrowth !== null ? `${is.revenueGrowth >= 0 ? '+' : ''}${is.revenueGrowth.toFixed(1)}%` : '-'}
                      </td>
                      <td className={`text-right py-2 px-2 ${is.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {currencySymbol}{formatLargeNumber(is.netIncome)}
                      </td>
                      <td className={`text-right py-2 px-2 ${is.eps >= 0 ? 'text-slate-300' : 'text-red-400'}`}>
                        {currencySymbol}{is.eps.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Balance Sheet Summary */}
          {balanceSheets.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-300 mb-3">Bilan (5 dernières années)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 px-2">Année</th>
                      <th className="text-right py-2 px-2">Actif total</th>
                      <th className="text-right py-2 px-2">Capitaux propres</th>
                      <th className="text-right py-2 px-2">Dette totale</th>
                      <th className="text-right py-2 px-2">Dette/CP</th>
                      <th className="text-right py-2 px-2">Ratio courant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanceSheets.slice(0, 5).map((bs) => (
                      <tr key={bs.year} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-2 px-2 font-medium">{bs.year}</td>
                        <td className="text-right py-2 px-2">{currencySymbol}{formatLargeNumber(bs.totalAssets)}</td>
                        <td className={`text-right py-2 px-2 ${bs.totalEquity >= 0 ? 'text-slate-300' : 'text-red-400'}`}>
                          {currencySymbol}{formatLargeNumber(bs.totalEquity)}
                        </td>
                        <td className="text-right py-2 px-2 text-slate-300">
                          {currencySymbol}{formatLargeNumber(bs.totalDebt)}
                        </td>
                        <td className={`text-right py-2 px-2 ${bs.debtToEquity !== null ? getMetricColor(bs.debtToEquity, { good: 50, warning: 100, isInverse: true }) : 'text-slate-500'}`}>
                          {bs.debtToEquity !== null ? `${bs.debtToEquity.toFixed(0)}%` : '-'}
                        </td>
                        <td className={`text-right py-2 px-2 ${bs.currentRatio !== null ? getMetricColor(bs.currentRatio, { good: 1.5, warning: 1 }) : 'text-slate-500'}`}>
                          {bs.currentRatio !== null ? bs.currentRatio.toFixed(2) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cash Flow Summary */}
          {cashFlows.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-slate-300 mb-3">Flux de trésorerie (5 dernières années)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 px-2">Année</th>
                      <th className="text-right py-2 px-2">Cash-flow opérationnel</th>
                      <th className="text-right py-2 px-2">CAPEX</th>
                      <th className="text-right py-2 px-2">Free Cash-flow</th>
                      <th className="text-right py-2 px-2">Dividendes payés</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlows.slice(0, 5).map((cf) => (
                      <tr key={cf.year} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-2 px-2 font-medium">{cf.year}</td>
                        <td className={`text-right py-2 px-2 ${cf.operatingCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {currencySymbol}{formatLargeNumber(cf.operatingCashFlow)}
                        </td>
                        <td className="text-right py-2 px-2 text-slate-300">
                          {currencySymbol}{formatLargeNumber(cf.capitalExpenditure)}
                        </td>
                        <td className={`text-right py-2 px-2 ${cf.freeCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {currencySymbol}{formatLargeNumber(cf.freeCashFlow)}
                        </td>
                        <td className="text-right py-2 px-2 text-slate-300">
                          {cf.dividendsPaid > 0 ? `${currencySymbol}${formatLargeNumber(cf.dividendsPaid)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Legend */}
      <div className="bg-slate-700/30 rounded-lg p-3 mt-4">
        <p className="text-slate-400 text-xs">
          <span className="font-medium">Légende :</span>{' '}
          <span className="text-green-400">Bon</span> |{' '}
          <span className="text-yellow-400">Moyen</span> |{' '}
          <span className="text-red-400">À surveiller</span>
        </p>
        <p className="text-slate-500 text-xs mt-1">
          ROE &gt; 15% = bon | Marge nette &gt; 10% = bon | Dette/CP &lt; 50% = bon | Ratio courant &gt; 1.5 = bon
        </p>
      </div>
    </div>
  );
}
