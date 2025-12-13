import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function GlossarySheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
          📖 Glossaire
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-slate-900 border-slate-700 overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-white text-xl">
            📚 Guide des Indicateurs
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-8 text-sm">
          {/* Indicateurs Techniques */}
          <section>
            <h2 className="text-lg font-semibold text-blue-400 mb-4">
              1. Indicateurs Techniques
            </h2>

            {/* RSI */}
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-2">
                RSI (Relative Strength Index)
              </h3>
              <p className="text-slate-400 mb-3">
                Mesure la tension entre acheteurs et vendeurs. Oscille entre 0 et
                100.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-red-400 font-medium">70 — 100</span>
                  <span className="text-slate-300">
                    Zone de surachat. Éviter d'entrer.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-green-400 font-medium">50 — 70</span>
                  <span className="text-slate-300">
                    Zone d'achat. Momentum positif.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-orange-400 font-medium">30 — 50</span>
                  <span className="text-slate-300">
                    Zone de vente. Prudence.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-blue-400 font-medium">0 — 30</span>
                  <span className="text-slate-300">
                    Zone de survente. Opportunité potentielle.
                  </span>
                </div>
              </div>
            </div>

            {/* MM200 */}
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-2">
                MM200 (Moyenne Mobile 200 jours)
              </h3>
              <p className="text-slate-400 mb-3">
                Cours moyen sur 200 jours. Référence pour la tendance long terme.
              </p>
              <ul className="space-y-1 text-slate-300">
                <li>
                  <span className="text-green-400">Cours {'>'} MM200</span> :
                  Tendance haussière. Privilégier les achats.
                </li>
                <li>
                  <span className="text-red-400">Cours {'<'} MM200</span> :
                  Tendance baissière. Attendre un retournement.
                </li>
              </ul>
            </div>

            {/* MACD */}
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-2">
                MACD (Moving Average Convergence Divergence)
              </h3>
              <p className="text-slate-400 mb-3">
                Différence entre deux moyennes mobiles. Confirme les changements de
                momentum.
              </p>
              <ul className="space-y-1 text-slate-300">
                <li>
                  <span className="text-green-400">MACD {'>'} Signal</span> :
                  Momentum haussier.
                </li>
                <li>
                  <span className="text-red-400">MACD {'<'} Signal</span> :
                  Momentum baissier.
                </li>
              </ul>
            </div>

            {/* ATR */}
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-2">
                ATR (Average True Range)
              </h3>
              <p className="text-slate-400">
                Mesure la volatilité moyenne. Utile pour dimensionner les positions
                et placer les stop-loss. Plus l'ATR est élevé, plus les stops
                doivent être larges.
              </p>
            </div>
          </section>

          {/* Indicateurs Fondamentaux */}
          <section>
            <h2 className="text-lg font-semibold text-blue-400 mb-4">
              2. Indicateurs Fondamentaux
            </h2>

            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="font-medium text-white">PER (Price/Earnings)</h4>
                <p className="text-slate-400 text-xs mt-1">
                  Combien tu paies pour 1€ de bénéfice.
                </p>
                <p className="text-slate-300 text-xs mt-1">
                  {'<'} 15 : sous-évalué | {'>'} 25 : cher
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="font-medium text-white">PEG (PER/Croissance)</h4>
                <p className="text-slate-400 text-xs mt-1">
                  Ajuste le PER à la croissance.
                </p>
                <p className="text-slate-300 text-xs mt-1">
                  {'<'} 1 : croissance non pricée | {'>'} 2 : surévalué
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="font-medium text-white">ROE (Return on Equity)</h4>
                <p className="text-slate-400 text-xs mt-1">
                  Rentabilité des capitaux propres.
                </p>
                <p className="text-slate-300 text-xs mt-1">
                  {'>'} 15% stable : excellente gestion
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="font-medium text-white">Debt/Equity</h4>
                <p className="text-slate-400 text-xs mt-1">
                  Niveau d'endettement.
                </p>
                <p className="text-slate-300 text-xs mt-1">
                  {'<'} 0.5 : solide | {'>'} 1 : surveiller
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="font-medium text-white">FCF (Free Cash Flow)</h4>
                <p className="text-slate-400 text-xs mt-1">
                  Cash disponible après investissements.
                </p>
                <p className="text-slate-300 text-xs mt-1">
                  Positif et croissant : santé réelle
                </p>
              </div>
            </div>
          </section>

          {/* Checklist */}
          <section>
            <h2 className="text-lg font-semibold text-blue-400 mb-4">
              3. Checklist d'Achat
            </h2>

            <div className="mb-4">
              <h4 className="font-medium text-green-400 mb-2">✅ Bon signal</h4>
              <ul className="space-y-1 text-slate-300 text-xs">
                <li>• Cours {'>'} MM200</li>
                <li>• RSI entre 40 et 70</li>
                <li>• MACD haussier</li>
                <li>• Rebond sur support avec volumes</li>
                <li>• PER raisonnable vs secteur</li>
                <li>• FCF positif et croissant</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-red-400 mb-2">❌ Éviter</h4>
              <ul className="space-y-1 text-slate-300 text-xs">
                <li>• Cours {'<'} MM200 en baisse</li>
                <li>• RSI {'>'} 70 (surachat)</li>
                <li>• Rebond sans volumes</li>
                <li>• Juste avant earnings</li>
                <li>• PER {'>'} 30 sans croissance</li>
              </ul>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="border-t border-slate-700 pt-4">
            <p className="text-slate-500 text-xs">
              ⚠️ Ce guide est un outil d'aide à la décision, pas une garantie de
              résultat. L'investissement en bourse comporte des risques.
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
