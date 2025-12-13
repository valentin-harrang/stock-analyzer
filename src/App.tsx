import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StockAnalyzer } from './StockAnalyzer';
import { TrendingPage } from './pages/TrendingPage';
import { Cac40Page } from './pages/Cac40Page';
import { DividendsPage } from './pages/DividendsPage';
import { PeaPage } from './pages/PeaPage';
import { Navigation } from './components/Navigation';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto p-6">
          <Navigation />

          <Routes>
            <Route path="/" element={<StockAnalyzer />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/cac40" element={<Cac40Page />} />
            <Route path="/dividends" element={<DividendsPage />} />
            <Route path="/pea" element={<PeaPage />} />
          </Routes>

          {/* Footer - Sources */}
          <footer className="mt-12 pt-6 border-t border-slate-800">
            <div className="text-center text-slate-500 text-xs space-y-2">
              <p className="font-medium text-slate-400">Sources des données</p>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                <span>
                  📊 Prix & historiques :{' '}
                  <a
                    href="https://finance.yahoo.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Yahoo Finance
                  </a>
                </span>
                <span>
                  💱 Taux de change :{' '}
                  <a
                    href="https://finance.yahoo.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Yahoo Finance
                  </a>
                </span>
                <span>
                  🤖 Analyse IA :{' '}
                  <a
                    href="https://groq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Groq (Llama 3.3)
                  </a>
                </span>
              </div>
              <p className="text-slate-600 mt-3">
                Les indicateurs techniques (RSI, MACD, MM200, ATR) sont calculés
                localement à partir des données historiques.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
