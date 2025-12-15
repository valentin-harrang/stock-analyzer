import { useState, useCallback } from 'react';
import type {
  SearchResult,
  StockData,
  TechnicalIndicators,
  FullAnalysis,
  Currency,
  ValuationData,
  ChartData,
} from './stockAnalyzer.types';
import {
  fetchDailyPrices,
  analyzeWithGroq,
  fetchExchangeRate,
  fetchValuationData,
  fetchDividendData,
  fetchFinancialStatements,
} from './stockAnalyzer.api';
import { calculateMACD, calculateRSI, calculateATR, calculateValuationVerdict, analyzeMM200, detectConsolidation } from './stockAnalyzer.utils';

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
        setProgress('Récupération des données...');
        const [priceData, valuationRaw, dividendData, financialsData] = await Promise.all([
          fetchDailyPrices(symbol),
          fetchValuationData(symbol).catch(() => null),
          fetchDividendData(symbol).catch(() => null),
          fetchFinancialStatements(symbol).catch(() => null),
        ]);
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

        // Analyse MM200 (données chronologiques: du plus ancien au plus récent)
        const mm200Analysis = analyzeMM200(closesRev, 200);

        // Détection de consolidation
        const consolidation = detectConsolidation(highsRev, lowsRev, closesRev);

        const indicators: TechnicalIndicators = {
          mm200: mm200Analysis.value,
          mm200Analysis,
          consolidation,
          rsi: calculateRSI(closesRev, 14),
          macd: macdResult.macd,
          macdSignal: macdResult.macdSignal,
          macdHist: macdResult.macdHist,
          atr: calculateATR(highsRev, lowsRev, closesRev, 14),
          priceAboveMM200: mm200Analysis.priceAbove,
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

        // Préparer les données de valorisation
        const valuation: ValuationData = valuationRaw ?? {
          trailingPE: null,
          pegRatio: null,
          priceToBook: null,
          fiftyTwoWeekHigh: Math.max(...convertedHighs),
          fiftyTwoWeekLow: Math.min(...convertedLows),
          currentPrice: convertedCloses[0],
        };

        // Appliquer le taux de change aux valeurs 52W si elles viennent de l'API
        if (valuationRaw) {
          valuation.fiftyTwoWeekHigh = valuationRaw.fiftyTwoWeekHigh * exchangeRate;
          valuation.fiftyTwoWeekLow = valuationRaw.fiftyTwoWeekLow * exchangeRate;
          valuation.currentPrice = convertedCloses[0];
        }

        const valuationVerdict = calculateValuationVerdict(valuation);

        // Données pour le graphique (converties en devise cible)
        const convertedOpens = priceData.opens.map((o) => o * exchangeRate);
        const chartData: ChartData = {
          dates,
          opens: convertedOpens,
          highs: convertedHighs,
          lows: convertedLows,
          closes: convertedCloses,
        };

        setProgress('Analyse IA...');
        const aiAnalysis = await analyzeWithGroq(stock, indicators);
        setAnalysis({
          stock,
          indicators,
          valuation,
          valuationVerdict,
          analysis: aiAnalysis,
          chartData,
          dividend: dividendData,
          financials: financialsData,
        });
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
