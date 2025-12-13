import type { MACDResult, ValuationData, ValuationVerdict } from './stockAnalyzer.types';

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
  const { trailingPE, forwardPE, pegRatio, priceToBook } = valuation;

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

  // Comparaison P/E Forward vs Trailing (amélioration attendue)
  if (forwardPE !== null && trailingPE !== null && forwardPE < trailingPE) {
    score += 1;
    reasons.push('P/E Forward < Trailing (amélioration prévue)');
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
