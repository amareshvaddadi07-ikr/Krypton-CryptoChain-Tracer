export interface PatternRule {
  amountSlab: [number, number];
  timeGap: [number, number];
  gasFee: [number, number];
  chain: string[];
  hopCount?: [number, number];
  dex?: boolean;
  timeOfDay?: [number, number];
}

export interface VaspPrediction {
  name: string;
  wallet: string;
  confidence: number;
  reason: string;
}

export interface Pattern {
  id: string;
  name: string;
  rules: PatternRule;
  vaspPrediction: VaspPrediction;
  similarCases: number;
}

export interface PatternMatchResult {
  pattern: Pattern;
  score: number;
  breakdown: {
    amountScore: number;
    timeGapScore: number;
    gasFeeScore: number;
    chainScore: number;
    dexScore: number;
  };
  predictedVasp: VaspPrediction;
  similarCasesCount: number;
  explanation: string;
}

export interface SimilarCase {
  fir: string;
  date: string;
  amount: string;
  mo: string;
  pattern: string;
  vasp: string;
  status: 'FROZEN' | 'KYC_RECEIVED' | 'CHARGESHEET';
  similarity: number;
}

export const PATTERNS: Pattern[] = [
  {
    id: 'TASK_FRAUD_VZG',
    name: 'National Task Fraud Syndicate',
    rules: {
      amountSlab: [10000, 500000],
      timeGap: [120, 240],
      gasFee: [0.25, 0.28],
      chain: ['TRON'],
      hopCount: [2, 4],
      dex: false,
      timeOfDay: [11, 14],
    },
    vaspPrediction: {
      name: 'WazirX',
      wallet: 'TLa2w8q6e4r2t1y7u8i9o0p1a2s3d4f8c9',
      confidence: 89,
      reason: 'TRON-only direct pattern matches 23/30 NCRP task cases',
    },
    similarCases: 23,
  },
  {
    id: 'INVESTMENT_HOP',
    name: 'Investment Fraud - Chain Hop',
    rules: {
      amountSlab: [200000, 1000000],
      timeGap: [480, 900],
      gasFee: [0.25, 0.28],
      chain: ['TRON', 'ETH'],
      dex: true,
    },
    vaspPrediction: {
      name: 'Binance',
      wallet: 'TQb9BinanceHot',
      confidence: 76,
      reason: 'SunSwap->ETH 76% goes to Binance',
    },
    similarCases: 14,
  },
];

export const SIMILAR_CASES_DATA: SimilarCase[] = [
  {
    fir: 'NCRP/2025/8808',
    date: '28 Aug 2026',
    amount: '₹1,85,000',
    mo: 'Telegram Task Fraud (Like & Subscribe)',
    pattern: 'National Task Fraud Syndicate',
    vasp: 'WazirX',
    status: 'FROZEN',
    similarity: 94,
  },
  {
    fir: 'NCRP/2025/8792',
    date: '19 Aug 2026',
    amount: '₹2,10,000',
    mo: 'Part-Time Rating Scam (E-Commerce)',
    pattern: 'National Task Fraud Syndicate',
    vasp: 'WazirX',
    status: 'KYC_RECEIVED',
    similarity: 91,
  },
  {
    fir: 'NCRP/2025/8774',
    date: '08 Aug 2026',
    amount: '₹1,45,000',
    mo: 'Hotel Booking Review Task',
    pattern: 'National Task Fraud Syndicate',
    vasp: 'WazirX',
    status: 'FROZEN',
    similarity: 88,
  },
  {
    fir: 'NCRP/2025/8755',
    date: '01 Aug 2026',
    amount: '₹3,20,000',
    mo: 'Cryptocurrency Arbitrage Scheme',
    pattern: 'Investment Fraud - Chain Hop',
    vasp: 'Binance',
    status: 'CHARGESHEET',
    similarity: 86,
  },
  {
    fir: 'NCRP/2025/8741',
    date: '25 Jul 2026',
    amount: '₹1,95,000',
    mo: 'YouTube Video Booster Task',
    pattern: 'National Task Fraud Syndicate',
    vasp: 'WazirX',
    status: 'FROZEN',
    similarity: 85,
  },
  {
    fir: 'NCRP/2025/8729',
    date: '14 Jul 2026',
    amount: '₹95,000',
    mo: 'E-commerce Prepaid Recharge',
    pattern: 'National Task Fraud Syndicate',
    vasp: 'WazirX',
    status: 'FROZEN',
    similarity: 84,
  },
  {
    fir: 'NCRP/2025/8710',
    date: '02 Jul 2026',
    amount: '₹4,50,000',
    mo: 'SunSwap Yield Staking Bait',
    pattern: 'Investment Fraud - Chain Hop',
    vasp: 'CoinDCX',
    status: 'KYC_RECEIVED',
    similarity: 82,
  },
  {
    fir: 'NCRP/2025/8698',
    date: '22 Jun 2026',
    amount: '₹1,60,000',
    mo: 'VIP WhatsApp Signals Scam',
    pattern: 'National Task Fraud Syndicate',
    vasp: 'WazirX',
    status: 'FROZEN',
    similarity: 80,
  },
  {
    fir: 'NCRP/2025/8684',
    date: '11 Jun 2026',
    amount: '₹2,40,000',
    mo: 'Foreign Currency Trader Phish',
    pattern: 'Investment Fraud - Chain Hop',
    vasp: 'Binance',
    status: 'CHARGESHEET',
    similarity: 78,
  },
  {
    fir: 'NCRP/2025/8667',
    date: '29 May 2026',
    amount: '₹1,20,000',
    mo: 'Telegram Influencer Channel Scam',
    pattern: 'National Task Fraud Syndicate',
    vasp: 'WazirX',
    status: 'FROZEN',
    similarity: 77,
  },
  {
    fir: 'NCRP/2025/8649',
    date: '15 May 2026',
    amount: '₹1,75,000',
    mo: 'Freelance Data Entry Bonus Bait',
    pattern: 'National Task Fraud Syndicate',
    vasp: 'WazirX',
    status: 'FROZEN',
    similarity: 75,
  },
  {
    fir: 'NCRP/2025/8633',
    date: '02 May 2026',
    amount: '₹88,000',
    mo: 'Google Maps 5-Star Review Scam',
    pattern: 'National Task Fraud Syndicate',
    vasp: 'WazirX',
    status: 'KYC_RECEIVED',
    similarity: 74,
  },
];

/**
 * Match a trail against the forensic pattern library.
 * Score weights:
 * 25% Amount Slab + 25% Time Gap + 20% Gas Fee + 15% Chain + 15% DEX = 100%
 */
export function matchPattern(trail: {
  amount: number;
  avgTimeGap?: number;
  gasFees?: number[];
  chains?: string[];
  chain?: string;
  hasDex?: boolean;
  nodes?: any[];
}): PatternMatchResult {
  const amount = trail.amount || 200000;
  const avgTimeGap = trail.avgTimeGap ?? 180;
  const gasFee = trail.gasFees && trail.gasFees.length > 0 ? trail.gasFees[0] : 0.26;
  const chains = trail.chains || [trail.chain || 'TRON'];
  const hasDex = Boolean(trail.hasDex || trail.nodes?.some((n: any) => n.type === 'dex'));

  let bestMatch: Pattern = PATTERNS[0];
  let highestScore = 0;
  let bestBreakdown = {
    amountScore: 25,
    timeGapScore: 25,
    gasFeeScore: 20,
    chainScore: 15,
    dexScore: 15,
  };

  PATTERNS.forEach((p) => {
    // 1. Amount slab (25%)
    let amountScore = 0;
    if (amount >= p.rules.amountSlab[0] && amount <= p.rules.amountSlab[1]) {
      amountScore = 25;
    } else {
      const dist = Math.min(
        Math.abs(amount - p.rules.amountSlab[0]),
        Math.abs(amount - p.rules.amountSlab[1])
      );
      amountScore = Math.max(5, Math.round(25 - (dist / 100000) * 5));
    }

    // 2. Time gap (25%)
    let timeGapScore = 0;
    if (avgTimeGap >= p.rules.timeGap[0] && avgTimeGap <= p.rules.timeGap[1]) {
      timeGapScore = 25;
    } else {
      timeGapScore = Math.max(10, 25 - Math.min(15, Math.round(Math.abs(avgTimeGap - 180) / 30)));
    }

    // 3. Gas fee (20%)
    let gasFeeScore = 0;
    if (gasFee >= p.rules.gasFee[0] && gasFee <= p.rules.gasFee[1]) {
      gasFeeScore = 20;
    } else {
      gasFeeScore = 15;
    }

    // 4. Chain match (15%)
    let chainScore = 0;
    const chainOverlap = p.rules.chain.some((c) => chains.includes(c));
    if (chainOverlap) {
      chainScore = 15;
    } else {
      chainScore = 5;
    }

    // 5. DEX match (15%)
    let dexScore = 0;
    if (Boolean(p.rules.dex) === hasDex) {
      dexScore = 15;
    } else {
      dexScore = 5;
    }

    const total = amountScore + timeGapScore + gasFeeScore + chainScore + dexScore;
    if (total > highestScore) {
      highestScore = total;
      bestMatch = p;
      bestBreakdown = {
        amountScore,
        timeGapScore,
        gasFeeScore,
        chainScore,
        dexScore,
      };
    }
  });

  return {
    pattern: bestMatch,
    score: highestScore,
    breakdown: bestBreakdown,
    predictedVasp: bestMatch.vaspPrediction,
    similarCasesCount: bestMatch.similarCases,
    explanation: `Amount Slab (${bestBreakdown.amountScore}%) + Time Gap (${bestBreakdown.timeGapScore}%) + Gas Fee (${bestBreakdown.gasFeeScore}%) + Chain Match (${bestBreakdown.chainScore}%) + DEX Route (${bestBreakdown.dexScore}%) = ${highestScore}%`,
  };
}
