// National Cybercrime Reporting Portal (NCRP) - Mule & Fraud Registry
export interface NcrpCase {
  id: string;
  sNo: number;
  fir: string;
  ps: string;
  amount: string;
  amountNumeric: number;
  complainant: string;
  date: string;
  chain: string;
  status: 'FROZEN' | 'KYC_RECEIVED' | 'CHARGESHEET' | 'PENDING_VASP';
  mo: string;
  vasp: string;
  matchScore: number;
  isBotPacing?: boolean;
  gasType?: 'fixed' | 'variable';
  dex?: string;
}

import ncrpRawData from './ncrpDatabase.json';

export const NCRP_DATABASE: NcrpCase[] = ncrpRawData.map((item, idx) => ({
  sNo: idx + 1,
  id: item.id || `ncrp-${idx + 1}`,
  fir: item.fir,
  ps: item.ps || 'Cyber Crime PS',
  amount: typeof item.amount === 'number' ? `₹${item.amount.toLocaleString('en-IN')}` : String(item.amount),
  amountNumeric: typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount).replace(/[^\d.]/g, '')) || 345000,
  complainant: item.complainant || 'Complainant',
  date: '2026-08-' + String((idx % 28) + 1).padStart(2, '0'),
  chain: item.chain || 'TRON TRC20',
  status: (item.status as any) || 'FROZEN',
  mo: item.mo || 'Telegram Task Fraud',
  vasp: item.vasp || 'WazirX',
  matchScore: 85,
  isBotPacing: item.isBotPacing !== undefined ? item.isBotPacing : true,
  gasType: (item.gasType as any) || 'fixed',
  dex: item.dex || 'SunSwap LP',
}));

/**
 * Filter and rank NCRP cases dynamically against a target wallet amount / cluster
 * Uses fuzzy matching (40% threshold)
 */
export function getSimilarNcrpCases(walletAddress: string, targetAmount?: number): NcrpCase[] {
  const safeAmount = targetAmount && targetAmount > 0 ? targetAmount : 345000;
  const isTron = !walletAddress || walletAddress.startsWith('T');
  const targetChain = isTron ? 'TRON TRC20' : 'ETH ERC20';

  return NCRP_DATABASE.map((c) => {
    let score = 0;

    // Amount Slab fuzzy: within 50% range (+20), within 100% (+10)
    const amountDiff = Math.abs(c.amountNumeric - safeAmount) / safeAmount;
    if (amountDiff < 0.5) {
      score += 20;
    } else if (amountDiff < 1.0) {
      score += 10;
    }

    // Time Gap: bot pacing vs manual (+20)
    if (c.isBotPacing === true) {
      score += 20;
    }

    // Gas Fee: fixed vs variable (+20)
    if (c.gasType === 'fixed') {
      score += 20;
    }

    // Chain Match (+20)
    if (c.chain.toUpperCase().includes(isTron ? 'TRON' : 'ETH')) {
      score += 20;
    }

    // DEX Route (+20)
    if (c.dex && c.dex !== 'None') {
      score += 20;
    }

    return {
      ...c,
      matchScore: score,
    };
  })
  .filter((c) => c.matchScore >= 40)
  .sort((a, b) => b.matchScore - a.matchScore);
}
