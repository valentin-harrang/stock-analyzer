import { useState, useCallback } from 'react';
import type {
  SearchResult,
  StockData,
  TechnicalIndicators,
  FullAnalysis,
} from './stockAnalyzer.types';
import { fetchDailyPrices, analyzeWithGroq } from './stockAnalyzer.api';
import { calculateMACD, calculateRSI, calculateATR } from './stockAnalyzer.utils';

interface UseStockAnalysisReturn {
  loading: boolean;
  progress: string;
  error: string | null;
  analysis: FullAnalysis | null;
  analyze: (query: string, selectedStock: SearchResult | null) => Promise<void>;
  clearAnalysis: () => void;
  clearError: () => void;
}

export function useStockAnalysis(): UseStockAnalysisReturn {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const analyze = useCallback(
    async (query: string, selectedStock: SearchResult | null) => {
      const symbol = selectedStock?.symbol || query.split(' ')[0].toUpperCase();
      if (!symbol) return;

      setLoading(true);
      setError(null);
      setAnalysis(null);

      try {
        setProgress('Récupération des prix...');
        const priceData = await fetchDailyPrices(symbol);
        if (!priceData) throw new Error('Données indisponibles');

        const { dates, highs, lows, closes, volumes } = priceData;
        setProgress('Calcul des indicateurs...');

        const closesRev = [...closes].reverse();
        const highsRev = [...highs].reverse();
        const lowsRev = [...lows].reverse();

        const macdResult = calculateMACD(closesRev);
        const mm200 =
          closes.slice(0, 200).reduce((a, b) => a + b, 0) /
          Math.min(200, closes.length);

        const indicators: TechnicalIndicators = {
          mm200,
          rsi: calculateRSI(closesRev, 14),
          macd: macdResult.macd,
          macdSignal: macdResult.macdSignal,
          macdHist: macdResult.macdHist,
          atr: calculateATR(highsRev, lowsRev, closesRev, 14),
          priceAboveMM200: closes[0] > mm200,
        };

        const stock: StockData = {
          ticker: symbol,
          name: selectedStock?.name || symbol,
          price: closes[0],
          previousClose: closes[1],
          change: closes[0] - closes[1],
          changePercent: ((closes[0] - closes[1]) / closes[1]) * 100,
          volume: volumes[0],
          date: dates[0],
          currency: selectedStock?.currency || 'USD',
        };

        setProgress('Analyse IA...');
        const aiAnalysis = await analyzeWithGroq(stock, indicators);
        setAnalysis({ stock, indicators, analysis: aiAnalysis });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      } finally {
        setLoading(false);
        setProgress('');
      }
    },
    []
  );

  return {
    loading,
    progress,
    error,
    analysis,
    analyze,
    clearAnalysis,
    clearError,
  };
}
