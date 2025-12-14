export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export interface StockData {
  ticker: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  date: string;
  currency: string;
}

export type MM200Slope = 'rising' | 'flat' | 'falling';

export interface MM200Analysis {
  value: number;
  slope: MM200Slope;
  slopePercent: number;
  priceAbove: boolean;
  distancePercent: number;
}

export interface ConsolidationData {
  isConsolidating: boolean;
  days: number;
  rangePercent: number;
}

export interface TechnicalIndicators {
  mm200: number;
  mm200Analysis: MM200Analysis;
  consolidation: ConsolidationData;
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  atr: number;
  priceAboveMM200: boolean;
}

export interface MACDResult {
  macd: number;
  macdSignal: number;
  macdHist: number;
}

export interface Analysis {
  verdict: 'FAVORABLE' | 'NEUTRE' | 'DÉFAVORABLE';
  score: number;
  emoji: string;
  color: string;
  summary: string;
  positives: string[];
  warnings: string[];
  negatives: string[];
}

export interface ValuationData {
  trailingPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currentPrice: number;
}

export type ValuationStatus = 'SOUS-ÉVALUÉE' | 'JUSTE VALEUR' | 'SURÉVALUÉE' | 'INDÉTERMINÉ';

export interface ValuationVerdict {
  status: ValuationStatus;
  emoji: string;
  color: string;
  explanation: string;
}

export interface FullAnalysis {
  stock: StockData;
  indicators: TechnicalIndicators;
  valuation: ValuationData;
  valuationVerdict: ValuationVerdict;
  analysis: Analysis;
}

export interface PriceData {
  dates: string[];
  opens: number[];
  highs: number[];
  lows: number[];
  closes: number[];
  volumes: number[];
}

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF';

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'USD', label: 'Dollar US', symbol: '$' },
  { value: 'GBP', label: 'Livre Sterling', symbol: '£' },
  { value: 'CHF', label: 'Franc Suisse', symbol: 'CHF' },
];
