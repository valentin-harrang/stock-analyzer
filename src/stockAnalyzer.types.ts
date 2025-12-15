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

export interface ChartData {
  dates: string[];
  opens: number[];
  highs: number[];
  lows: number[];
  closes: number[];
}

export interface DividendData {
  dividendYield: number | null;
  dividendPerShare: number | null;
  payoutRatio: number | null;
  exDividendDate: string | null;
  paymentDate: string | null;
  dividendGrowth5Y: number | null;
  consecutiveYears: number | null;
}

export interface IncomeStatementData {
  year: string;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  eps: number;
  revenueGrowth: number | null;
  netIncomeGrowth: number | null;
}

export interface BalanceSheetData {
  year: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalDebt: number;
  cash: number;
  debtToEquity: number | null;
  currentRatio: number | null;
}

export interface CashFlowData {
  year: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  dividendsPaid: number;
}

export interface FinancialStatements {
  incomeStatements: IncomeStatementData[];
  balanceSheets: BalanceSheetData[];
  cashFlows: CashFlowData[];
  keyMetrics: {
    grossMargin: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
    roe: number | null;
    roa: number | null;
    revenueGrowth3Y: number | null;
    epsGrowth3Y: number | null;
  };
}

export interface FullAnalysis {
  stock: StockData;
  indicators: TechnicalIndicators;
  valuation: ValuationData;
  valuationVerdict: ValuationVerdict;
  analysis: Analysis;
  chartData: ChartData;
  dividend: DividendData | null;
  financials: FinancialStatements | null;
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
