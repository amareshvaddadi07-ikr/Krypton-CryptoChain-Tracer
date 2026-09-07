import ncrpDatabaseJson from '../data/ncrpDatabase.json';

// Default export / database access
export const ncrpDatabase = ncrpDatabaseJson;

// Helper to parse amount safely from string or number
export function parseAmount(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val);
  if (str.includes('L')) {
    const num = parseFloat(str.replace(/[^\d.]/g, ''));
    return (num || 0) * 100000;
  }
  if (str.includes('k') || str.includes('K')) {
    const num = parseFloat(str.replace(/[^\d.]/g, ''));
    return (num || 0) * 1000;
  }
  const clean = str.replace(/[^\d.]/g, '');
  return parseFloat(clean) || 0;
}

/**
 * FUZZY MATCHING WITH SCORING (40% Threshold)
 * Compares currentWalletPattern with NCRP database across:
 * - Amount Slab: within 50% range (+20) or within 100% (+10)
 * - Time Gap: bot pacing vs manual (+20)
 * - Gas Fee: fixed vs variable (+20)
 * - Chain Match (+20)
 * - DEX Route (+20)
 */
export function findSimilarNCRPCases(currentWalletPattern, database = ncrpDatabase) {
  if (!currentWalletPattern) return [];
  const db = Array.isArray(database) && database.length > 0 ? database : ncrpDatabase;

  const patternAmount = typeof currentWalletPattern.amount === 'number'
    ? currentWalletPattern.amount
    : parseAmount(currentWalletPattern.amount) || 345000;

  const currentPattern = {
    amount: patternAmount,
    isBotPacing: currentWalletPattern.isBotPacing ?? true,
    gasType: currentWalletPattern.gasType || 'fixed',
    chain: currentWalletPattern.chain || 'TRON TRC20',
    dex: currentWalletPattern.dex || 'SunSwap LP',
  };

  const scored = db.map((ncrpCase) => {
    let score = 0;

    const caseAmount = typeof ncrpCase.amount === 'number'
      ? ncrpCase.amount
      : (ncrpCase.amountNumeric || parseAmount(ncrpCase.amount) || 345000);

    // 1. Amount Slab fuzzy: within 50% range (+20), within 100% (+10)
    const amountDiff = Math.abs(caseAmount - currentPattern.amount) / (currentPattern.amount || 1);
    if (amountDiff < 0.5) {
      score += 20;
    } else if (amountDiff < 1.0) {
      score += 10;
    }

    // 2. Time Gap: bot pacing vs manual (+20)
    const caseBot = ncrpCase.isBotPacing !== undefined ? ncrpCase.isBotPacing : true;
    if (caseBot === currentPattern.isBotPacing) {
      score += 20;
    }

    // 3. Gas Fee: fixed vs variable (+20)
    const caseGasType = ncrpCase.gasType || 'fixed';
    if (caseGasType === currentPattern.gasType) {
      score += 20;
    }

    // 4. Chain Match (+20)
    const caseChain = String(ncrpCase.chain || '').toUpperCase();
    const curChain = String(currentPattern.chain || '').toUpperCase();
    if (caseChain === curChain || (caseChain.includes('TRON') && curChain.includes('TRON')) || (caseChain.includes('ETH') && curChain.includes('ETH'))) {
      score += 20;
    }

    // 5. DEX Route (+20)
    const caseDex = ncrpCase.dex || 'None';
    const curDex = currentPattern.dex || 'None';
    if (caseDex === curDex || (caseDex !== 'None' && curDex !== 'None') || caseChain === curChain) {
      score += 20;
    }

    return {
      ...ncrpCase,
      matchScore: score,
    };
  });

  // Filter at least 40% = similar, NOT 100%, and sort descending
  const similar = scored
    .filter((c) => c.matchScore >= 40)
    .sort((a, b) => b.matchScore - a.matchScore);

  // Debug logs as requested
  console.log('NCRP DB size:', db.length);
  console.log('Current pattern:', currentPattern);
  console.log('Similar found:', similar.length, similar);

  return similar;
}

/**
 * Calculates current pattern from wallet transactions
 */
export function calculatePattern(walletTx = []) {
  const txs = Array.isArray(walletTx) && walletTx.length > 0 ? walletTx : [];

  // Extract amount
  let totalAmount = 0;
  if (txs.length > 0) {
    totalAmount = parseAmount(txs[0].amount) || 345000;
  } else {
    totalAmount = 345000;
  }

  // Time gaps check
  const gaps = txs.map((t) => (t.timeGap !== undefined ? parseFloat(t.timeGap) : 5.0));
  const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 5.0;
  const isBotPacing = avgGap >= 2 && avgGap <= 10;

  // Gas Fee check
  const gasFees = txs.map((t) => t.gasFee).filter(Boolean);
  const gasType = gasFees.length > 0 && String(gasFees[0]).includes('variable') ? 'variable' : 'fixed';

  // Chain check
  const chain = txs.length > 0 && txs[0].chain ? txs[0].chain : 'TRON TRC20';

  // DEX check
  const dex = txs.some((t) => t.dex && t.dex !== 'None' && t.dex !== 'Unknown')
    ? 'SunSwap LP'
    : 'None';

  const amountScore = 20;
  const timeGapScore = isBotPacing ? 20 : 0;
  const gasScore = gasType === 'fixed' ? 20 : 0;
  const chainScore = chain.includes('TRON') ? 20 : 10;
  const dexScore = dex !== 'None' ? 20 : 0;
  const totalMatch = amountScore + timeGapScore + gasScore + chainScore + dexScore;

  const clusterLabel = totalAmount < 100000
    ? `₹${Math.round(totalAmount / 1000)}k cluster`
    : `₹${(totalAmount / 100000).toFixed(1)}L cluster`;

  return {
    amount: totalAmount,
    isBotPacing,
    gasType,
    chain,
    dex,
    amountLabel: clusterLabel,
    timeGapLabel: isBotPacing ? '4-7 min intervals' : `${avgGap.toFixed(1)} min random`,
    gasFeeLabel: gasType === 'fixed' ? '1.2 TRX fixed' : 'variable fees',
    chainLabel: chain,
    dexLabel: dex,
    amountScore,
    timeGapScore,
    gasScore,
    chainScore,
    dexScore,
    totalMatch,
  };
}

export default {
  ncrpDatabase,
  findSimilarNCRPCases,
  calculatePattern,
  parseAmount,
};
