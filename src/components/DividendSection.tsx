import type { DividendData } from '../stockAnalyzer.types';

interface DividendSectionProps {
  dividend: DividendData | null;
  currencySymbol: string;
}

export function DividendSection({ dividend, currencySymbol }: DividendSectionProps) {
  if (!dividend) {
    return (
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-400">
          💵 Dividendes
        </h3>
        <div className="bg-slate-700/30 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-sm">
            Données de dividendes non disponibles pour cette action
          </p>
        </div>
      </div>
    );
  }

  const hasDividend = dividend.dividendYield || dividend.dividendPerShare;

  if (!hasDividend) {
    return (
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-400">
          💵 Dividendes
        </h3>
        <div className="bg-slate-700/30 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-sm">
            Cette action ne verse pas de dividende
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getYieldColor = (yieldPercent: number) => {
    if (yieldPercent >= 5) return 'text-green-400';
    if (yieldPercent >= 3) return 'text-yellow-400';
    if (yieldPercent >= 1) return 'text-slate-300';
    return 'text-slate-400';
  };

  const getPayoutColor = (payout: number) => {
    if (payout <= 50) return 'text-green-400';
    if (payout <= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 5) return 'text-green-400';
    if (growth >= 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-blue-400">
        💵 Dividendes
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Rendement */}
        {dividend.dividendYield !== null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Rendement</p>
            <p className={`text-xl font-semibold ${getYieldColor(dividend.dividendYield)}`}>
              {dividend.dividendYield.toFixed(2)}%
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {dividend.dividendYield >= 5 ? 'Élevé' :
               dividend.dividendYield >= 3 ? 'Modéré' :
               dividend.dividendYield >= 1 ? 'Faible' : 'Très faible'}
            </p>
          </div>
        )}

        {/* Dividende par action */}
        {dividend.dividendPerShare !== null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Par action (annuel)</p>
            <p className="text-xl font-semibold">
              {currencySymbol}{dividend.dividendPerShare.toFixed(2)}
            </p>
          </div>
        )}

        {/* Payout Ratio */}
        {dividend.payoutRatio !== null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Payout Ratio</p>
            <p className={`text-xl font-semibold ${getPayoutColor(dividend.payoutRatio)}`}>
              {dividend.payoutRatio.toFixed(0)}%
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {dividend.payoutRatio <= 50 ? 'Soutenable' :
               dividend.payoutRatio <= 75 ? 'Modéré' : 'Tendu'}
            </p>
          </div>
        )}

        {/* Croissance 5 ans */}
        {dividend.dividendGrowth5Y !== null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Croissance 5 ans</p>
            <p className={`text-xl font-semibold ${getGrowthColor(dividend.dividendGrowth5Y)}`}>
              {dividend.dividendGrowth5Y >= 0 ? '+' : ''}{dividend.dividendGrowth5Y.toFixed(1)}%
            </p>
            <p className="text-slate-500 text-xs mt-1">par an</p>
          </div>
        )}
      </div>

      {/* Dates de distribution */}
      {(dividend.exDividendDate || dividend.paymentDate) && (
        <div className="bg-slate-700/30 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-3">Prochaine distribution</p>
          <div className="grid grid-cols-2 gap-4">
            {dividend.exDividendDate && (
              <div>
                <p className="text-slate-500 text-xs">Date ex-dividende</p>
                <p className="text-slate-200 font-medium">{formatDate(dividend.exDividendDate)}</p>
              </div>
            )}
            {dividend.paymentDate && (
              <div>
                <p className="text-slate-500 text-xs">Date de paiement</p>
                <p className="text-slate-200 font-medium">{formatDate(dividend.paymentDate)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Légende */}
      <p className="text-slate-500 text-xs mt-4 text-center">
        Un payout ratio &lt; 60% est généralement considéré comme soutenable
      </p>
    </div>
  );
}
