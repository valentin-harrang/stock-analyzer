import { useState, useCallback } from 'react';
import type {
  SearchResult,
  StockData,
  TechnicalIndicators,
  FullAnalysis,
  Currency,
} from './stockAnalyzer.types';
import {
  fetchDailyPrices,
  analyzeWithGroq,
  fetchExchangeRate,
} from './stockAnalyzer.api';
import { calculateMACD, calculateRSI, calculateATR } from './stockAnalyzer.utils';

interface UseStockAnalysisReturn {
  loading: boolean;
  progress: string;
  error: string | null;
  analysis: FullAnalysis | null;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  analyze: (query: string, selectedStock: SearchResult | null) => Promise<void>;
  clearAnalysis: () => void;
  clearError: () => void;
}

export function useStockAnalysis(): UseStockAnalysisReturn {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [currency, setCurrency] = useState<Currency>('EUR');

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
        const stockCurrency = selectedStock?.currency || 'USD';

        setProgress('Conversion des devises...');
        const exchangeRate = await fetchExchangeRate(stockCurrency, currency);

        const convertedCloses = closes.map((c) => c * exchangeRate);
        const convertedHighs = highs.map((h) => h * exchangeRate);
        const convertedLows = lows.map((l) => l * exchangeRate);

        setProgress('Calcul des indicateurs...');

        const closesRev = [...convertedCloses].reverse();
        const highsRev = [...convertedHighs].reverse();
        const lowsRev = [...convertedLows].reverse();

        const macdResult = calculateMACD(closesRev);
        const mm200 =
          convertedCloses.slice(0, 200).reduce((a, b) => a + b, 0) /
          Math.min(200, convertedCloses.length);

        const indicators: TechnicalIndicators = {
          mm200,
          rsi: calculateRSI(closesRev, 14),
          macd: macdResult.macd,
          macdSignal: macdResult.macdSignal,
          macdHist: macdResult.macdHist,
          atr: calculateATR(highsRev, lowsRev, closesRev, 14),
          priceAboveMM200: convertedCloses[0] > mm200,
        };

        const stock: StockData = {
          ticker: symbol,
          name: selectedStock?.name || symbol,
          price: convertedCloses[0],
          previousClose: convertedCloses[1],
          change: convertedCloses[0] - convertedCloses[1],
          changePercent:
            ((convertedCloses[0] - convertedCloses[1]) / convertedCloses[1]) *
            100,
          volume: volumes[0],
          date: dates[0],
          currency,
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
    [currency]
  );

  return {
    loading,
    progress,
    error,
    analysis,
    currency,
    setCurrency,
    analyze,
    clearAnalysis,
    clearError,
  };
}
