import type { MACDResult, ValuationData, ValuationVerdict, MM200Analysis, MM200Slope, ConsolidationData } from './stockAnalyzer.types';

export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i];
  ema[period - 1] = sum / period;
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  return ema;
}

export function calculateMACD(prices: number[]): MACDResult {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine: number[] = [];
  for (let i = 25; i < prices.length; i++) {
    if (ema12[i] !== undefined && ema26[i] !== undefined) {
      macdLine.push(ema12[i] - ema26[i]);
    }
  }
  const signalLine = calculateEMA(macdLine, 9);
  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  return {
    macd: lastMacd,
    macdSignal: lastSignal,
    macdHist: lastMacd - lastSignal,
  };
}

export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0,
    losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number {
  const trueRanges: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    trueRanges.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
    );
  }
  const recentTRs = trueRanges.slice(-period);
  return recentTRs.reduce((a, b) => a + b, 0) / recentTRs.length;
}

/**
 * Calcule la MM200 sur une période et retourne un tableau de valeurs
 * prices: du plus ancien au plus récent
 */
export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

/**
 * Analyse complète de la MM200 : valeur, pente, position du cours
 * prices: du plus ancien au plus récent (chronologique)
 */
export function analyzeMM200(prices: number[], period: number = 200): MM200Analysis {
  if (prices.length < period) {
    const currentPrice = prices[prices.length - 1];
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    return {
      value: avgPrice,
      slope: 'flat',
      slopePercent: 0,
      priceAbove: currentPrice > avgPrice,
      distancePercent: ((currentPrice - avgPrice) / avgPrice) * 100,
    };
  }

  const smaValues = calculateSMA(prices, period);
  const currentMM200 = smaValues[smaValues.length - 1];
  const currentPrice = prices[prices.length - 1];

  // Calcul de la pente sur les 20 derniers jours de MM200
  const slopePeriod = Math.min(20, smaValues.length);
  const recentMM200 = smaValues.slice(-slopePeriod);
  const mm200Start = recentMM200[0];
  const mm200End = recentMM200[recentMM200.length - 1];
  const slopePercent = ((mm200End - mm200Start) / mm200Start) * 100;

  // Déterminer la tendance de la pente
  let slope: MM200Slope;
  if (slopePercent > 0.5) {
    slope = 'rising';
  } else if (slopePercent < -0.5) {
    slope = 'falling';
  } else {
    slope = 'flat';
  }

  // Distance du cours par rapport à la MM200
  const distancePercent = ((currentPrice - currentMM200) / currentMM200) * 100;

  return {
    value: currentMM200,
    slope,
    slopePercent,
    priceAbove: currentPrice > currentMM200,
    distancePercent,
  };
}

/**
 * Détecte une phase de consolidation (range serré)
 * highs, lows, closes: du plus ancien au plus récent (chronologique)
 *
 * Une consolidation est détectée quand:
 * - Le range (max-min) sur une période est < seuil% du prix moyen
 * - On compte le nombre de jours consécutifs en consolidation
 */
export function detectConsolidation(
  highs: number[],
  lows: number[],
  closes: number[],
  rangeThresholdPercent: number = 10
): ConsolidationData {
  if (closes.length < 10) {
    return { isConsolidating: false, days: 0, rangePercent: 0 };
  }

  // On cherche la consolidation depuis le jour actuel vers le passé
  let consolidationDays = 0;

  // Commencer avec les derniers jours et étendre
  for (let windowSize = 5; windowSize <= Math.min(60, closes.length); windowSize++) {
    const windowHighs = highs.slice(-windowSize);
    const windowLows = lows.slice(-windowSize);

    const maxHigh = Math.max(...windowHighs);
    const minLow = Math.min(...windowLows);
    const avgPrice = (maxHigh + minLow) / 2;
    const rangePercent = ((maxHigh - minLow) / avgPrice) * 100;

    if (rangePercent <= rangeThresholdPercent) {
      consolidationDays = windowSize;
    } else {
      break;
    }
  }

  // Calculer le range actuel sur la période de consolidation trouvée
  let rangePercent = 0;
  if (consolidationDays >= 5) {
    const windowHighs = highs.slice(-consolidationDays);
    const windowLows = lows.slice(-consolidationDays);
    const maxHigh = Math.max(...windowHighs);
    const minLow = Math.min(...windowLows);
    const avgPrice = (maxHigh + minLow) / 2;
    rangePercent = ((maxHigh - minLow) / avgPrice) * 100;
  }

  return {
    isConsolidating: consolidationDays >= 10,
    days: consolidationDays >= 5 ? consolidationDays : 0,
    rangePercent,
  };
}

export function getMM200SlopeLabel(slope: MM200Slope): { label: string; emoji: string; color: string } {
  switch (slope) {
    case 'rising':
      return { label: 'Montante', emoji: '📈', color: 'text-green-400' };
    case 'falling':
      return { label: 'Descendante', emoji: '📉', color: 'text-red-400' };
    default:
      return { label: 'Plate', emoji: '➡️', color: 'text-yellow-400' };
  }
}

export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'CHF':
      return 'CHF ';
    default:
      return '$';
  }
}

export function getVerdictStyle(verdict: string): string {
  switch (verdict) {
    case 'FAVORABLE':
      return 'bg-green-900/30 border-green-500 text-green-400';
    case 'DÉFAVORABLE':
      return 'bg-red-900/30 border-red-500 text-red-400';
    default:
      return 'bg-orange-900/30 border-orange-500 text-orange-400';
  }
}

export function calculateValuationVerdict(valuation: ValuationData): ValuationVerdict {
  const { trailingPE, pegRatio, priceToBook } = valuation;

  // Si pas assez de données, retourner indéterminé
  const hasEnoughData = trailingPE !== null || pegRatio !== null || priceToBook !== null;
  if (!hasEnoughData) {
    return {
      status: 'INDÉTERMINÉ',
      emoji: '⚪',
      color: 'gray',
      explanation: 'Données insuffisantes pour évaluer la valorisation',
    };
  }

  let score = 0;
  const reasons: string[] = [];

  // Analyse du PEG Ratio (le plus fiable)
  if (pegRatio !== null) {
    if (pegRatio < 1) {
      score += 2;
      reasons.push('PEG < 1 (croissance sous-évaluée)');
    } else if (pegRatio > 2) {
      score -= 2;
      reasons.push('PEG > 2 (croissance surévaluée)');
    } else if (pegRatio <= 1.5) {
      score += 1;
    }
  }

  // Analyse du P/E Trailing
  if (trailingPE !== null) {
    if (trailingPE < 15) {
      score += 1;
      reasons.push('P/E < 15 (valorisation attractive)');
    } else if (trailingPE > 35) {
      score -= 2;
      reasons.push('P/E > 35 (valorisation élevée)');
    } else if (trailingPE > 25) {
      score -= 1;
    }
  }

  // Analyse du Price to Book
  if (priceToBook !== null) {
    if (priceToBook < 1) {
      score += 2;
      reasons.push('P/B < 1 (sous la valeur comptable)');
    } else if (priceToBook < 2) {
      score += 1;
    } else if (priceToBook > 5) {
      score -= 1;
      reasons.push('P/B > 5 (prime élevée)');
    }
  }

  // Déterminer le verdict final
  if (score >= 3) {
    return {
      status: 'SOUS-ÉVALUÉE',
      emoji: '🟢',
      color: 'green',
      explanation: reasons.length > 0 ? reasons.join(' • ') : 'Ratios de valorisation attractifs',
    };
  } else if (score <= -2) {
    return {
      status: 'SURÉVALUÉE',
      emoji: '🔴',
      color: 'red',
      explanation: reasons.length > 0 ? reasons.join(' • ') : 'Ratios de valorisation élevés',
    };
  } else {
    return {
      status: 'JUSTE VALEUR',
      emoji: '🟠',
      color: 'orange',
      explanation: reasons.length > 0 ? reasons.join(' • ') : 'Valorisation dans les normes du marché',
    };
  }
}

export function getValuationVerdictStyle(status: string): string {
  switch (status) {
    case 'SOUS-ÉVALUÉE':
      return 'bg-green-900/30 border-green-500 text-green-400';
    case 'SURÉVALUÉE':
      return 'bg-red-900/30 border-red-500 text-red-400';
    case 'INDÉTERMINÉ':
      return 'bg-slate-700/30 border-slate-500 text-slate-400';
    default:
      return 'bg-orange-900/30 border-orange-500 text-orange-400';
  }
}
