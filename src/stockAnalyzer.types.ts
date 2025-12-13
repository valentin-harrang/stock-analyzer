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

export interface TechnicalIndicators {
  mm200: number;
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

export interface FullAnalysis {
  stock: StockData;
  indicators: TechnicalIndicators;
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
