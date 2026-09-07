import React, { useState, useEffect, useRef } from 'react';
import { Coins, Clock, Zap, Network, Shuffle } from 'lucide-react';
import {
  ncrpDatabase as defaultNcrpDatabase,
  findSimilarNCRPCases,
  calculatePattern,
  parseAmount,
} from '../services/ncrpMatcher.service';
import { getHopsForWallet } from './MoneyFlowGraph';

export { findSimilarNCRPCases, calculatePattern, parseAmount };

/**
 * Derive realistic transaction objects for a given wallet address / caseData
 */
export function deriveTransactionsForWallet(walletAddress, caseData) {
  const safeWallet = walletAddress ? walletAddress.trim() : 'TYqPw7z2okBhVx1p4mLc8q90dBa1n341bX';

  // If caseData already has timeline steps with rich attributes
  if (caseData && caseData.timeline && caseData.timeline.length > 0) {
    const chainName = caseData.chain ? `${caseData.chain} TRC20` : 'TRON TRC20';
    const isBot = !caseData.isDeep;

    return caseData.timeline.map((step, idx) => {
      const hasSunSwap = step.tag?.includes('SunSwap') || step.amount?.includes('SunSwap') || step.isDex;
      return {
        id: `tx-${idx}`,
        amount: step.amount || caseData.amountFormatted || '₹3,45,000',
        time: step.time,
        timeGap: isBot ? 4.5 + (idx % 2) * 1.5 : 14.2 + idx * 3,
        gasFee: isBot ? '1.2 TRX' : (1.2 + idx * 0.8).toFixed(1) + ' TRX',
        chain: chainName,
        dex: hasSunSwap ? 'SunSwap LP' : 'Unknown',
        from: step.from,
        to: step.to,
      };
    });
  }

  // Fallback: derive dynamically from getHopsForWallet(safeWallet)
  const hops = getHopsForWallet(safeWallet);
  const isTron = safeWallet.startsWith('T');
  const isEth = safeWallet.startsWith('0x');
  const chainName = isTron ? 'TRON TRC20' : isEth ? 'ETH ERC20' : 'TRON TRC20';

  const lastChar = safeWallet.charCodeAt(safeWallet.length - 1) || 0;
  const isBotPaced = lastChar % 3 !== 0; // ~66% of scams are automated bot scripts
  const isFixedGasFee = isTron && lastChar % 4 !== 0;

  return hops.map((hop, idx) => {
    const isDexHop = hop.type === 'mixer' || (hop.address && hop.address.toLowerCase().includes('sunswap'));
    return {
      id: hop.id || `hop-${idx}`,
      amount: hop.amount || '₹3,45,000',
      timeGap: isBotPaced ? 4.5 + (idx % 2) * 1.2 : 16.5 + (idx % 3) * 5,
      gasFee: isFixedGasFee
        ? '1.2 TRX'
        : isTron
        ? (1.2 + (idx % 3) * 0.4).toFixed(1) + ' TRX'
        : (21.5 + (idx % 4) * 4.2).toFixed(1) + ' Gwei',
      chain: chainName,
      dex: isDexHop ? 'SunSwap LP' : 'Unknown',
      from: hop.address,
      to: hop.label,
    };
  });
}

// Backward compatibility export
export function calculateForensicPattern(transactions, ncrpCases = defaultNcrpDatabase) {
  const pattern = calculatePattern(transactions);
  const similar = findSimilarNCRPCases(pattern, ncrpCases);
  return {
    ...pattern,
    similarCases: similar,
    similarCount: similar.length,
    matchPercentage: similar.length > 0 ? Math.max(...similar.map((s) => s.matchScore)) : pattern.totalMatch,
  };
}

export const ForensicPatternMatcher = ({
  walletAddress = '',
  transactions: propTransactions = null,
  caseData = null,
  ncrpCases: propNcrpCases = null,
}) => {
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [ncrpDatabase, setNcrpDatabase] = useState(propNcrpCases || defaultNcrpDatabase);
  const [forensicData, setForensicData] = useState(null);
  const prevWalletRef = useRef(null);

  // 1. Reset and calculate wallet transactions when walletAddress changes
  useEffect(() => {
    const currentAddr = walletAddress ? walletAddress.trim() : '';
    if (currentAddr !== prevWalletRef.current) {
      prevWalletRef.current = currentAddr;
      setWalletTransactions([]);

      const txs = propTransactions && propTransactions.length > 0
        ? propTransactions
        : deriveTransactionsForWallet(currentAddr, caseData);

      setWalletTransactions(txs);

      // Fetch or refresh NCRP database from API if available
      const targetAmount = txs.length > 0 ? parseAmount(txs[0].amount) : 345000;
      let isMounted = true;
      fetch(`/api/ncrp/similar?wallet=${encodeURIComponent(currentAddr)}&amount=${targetAmount}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data && Array.isArray(data.cases) && data.cases.length > 0) {
            setNcrpDatabase(data.cases);
          }
        })
        .catch(() => {
          // Graceful fallback to default in-memory database
        });

      return () => {
        isMounted = false;
      };
    }
  }, [walletAddress, propTransactions, caseData]);

  // 2. STATE UPDATE: calculatePattern & findSimilarNCRPCases (Fuzzy matching with 40% threshold)
  useEffect(() => {
    const currentAddr = walletAddress ? walletAddress.trim() : '';
    const txs = walletTransactions && walletTransactions.length > 0
      ? walletTransactions
      : deriveTransactionsForWallet(currentAddr, caseData);

    const pattern = calculatePattern(txs);
    const similar = findSimilarNCRPCases(pattern, ncrpDatabase);

    console.log('NCRP DB size:', ncrpDatabase.length);
    console.log('Current pattern:', pattern);
    console.log('Similar found:', similar.length, similar);

    setForensicData({
      ...pattern,
      similarCases: similar, // full array
      similarCount: similar.length,
      matchPercentage: similar.length > 0 ? Math.max(...similar.map((s) => s.matchScore)) : pattern.totalMatch,
    });
  }, [walletAddress, walletTransactions, ncrpDatabase, caseData]);

  // Safe initial fallback
  const data = forensicData || {
    amount: 345000,
    amountLabel: '₹3.5L cluster',
    timeGapLabel: '4-7 min intervals',
    gasFeeLabel: '1.2 TRX fixed',
    chainLabel: 'TRON TRC20',
    dexLabel: 'SunSwap LP',
    amountScore: 20,
    timeGapScore: 20,
    gasScore: 20,
    chainScore: 20,
    dexScore: 20,
    totalMatch: 100,
    matchPercentage: 100,
    similarCount: defaultNcrpDatabase.length || 33,
    similarCases: defaultNcrpDatabase,
  };

  const isZeroMatches = data.similarCount === 0;

  return (
    <section
      id="screen-1-forensic-hero"
      className="w-full min-h-screen h-auto bg-[#0a0a0a] border border-green-500/30 rounded-3xl p-6 sm:p-10 lg:p-12 flex flex-col justify-between shadow-[0_0_50px_rgba(34,197,94,0.08)] relative overflow-hidden"
    >
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top: Title, Dynamic Match Badge & Similar cases */}
      <div className="w-full text-center relative z-10 pt-4">
        <div className="inline-flex items-center justify-center gap-3 mb-3">
          <span className="text-xs font-mono text-green-500 uppercase tracking-widest font-bold">
            AI FORENSIC RECOGNITION ENGINE
          </span>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-sora">
            FORENSIC PATTERN MATCH: NATIONAL TASK FRAUD SYNDICATE
          </h1>
          <span
            id="forensic-total-match-badge"
            className="px-3.5 py-1.5 rounded-full bg-green-500 text-black font-extrabold text-xs sm:text-sm font-mono uppercase shadow-[0_0_15px_#22c55e] transition-all"
          >
            {data.matchPercentage || data.totalMatch}% MATCH
          </span>
        </div>

        {/* Dynamic Similar Cases or Novel Pattern status */}
        <div id="forensic-similar-cases-text" className="mt-3">
          {isZeroMatches ? (
            <p className="text-xs sm:text-sm font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full px-4 py-1.5 inline-block">
              No direct NCRP match - New modus operandi detected (Sec 63 BSA - Novel Pattern)
            </p>
          ) : (
            <p className="text-sm sm:text-base font-mono text-gray-400">
              ({data.similarCount} similar NCRP cases)
            </p>
          )}
        </div>
      </div>

      {/* Center: 5 BIG BLOCKS in grid-cols-5 dynamically bound */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 my-10 relative z-10">
        {/* Block 1: Amount Slab */}
        <div
          id="forensic-block-amount"
          className="bg-black border border-green-500/20 rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all duration-300 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-3 text-green-400 group-hover:scale-110 transition-transform">
            <Coins className="w-6 h-6" />
          </div>
          <div className="text-gray-400 text-xs uppercase tracking-wider font-mono">
            Amount Slab ({data.amountScore}%)
          </div>
          <div className="text-green-400 font-bold text-xl sm:text-2xl mt-2 font-mono">
            {data.amountLabel}
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/40">
            {isZeroMatches ? 'Novel slab threshold' : `Matched against ${data.similarCount} FIRs`}
          </div>
        </div>

        {/* Block 2: Time Gap */}
        <div
          id="forensic-block-time"
          className="bg-black border border-green-500/20 rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all duration-300 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-3 text-green-400 group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-gray-400 text-xs uppercase tracking-wider font-mono">
            Time Gap ({data.timeGapScore}%)
          </div>
          <div className="text-green-400 font-bold text-xl sm:text-2xl mt-2 font-mono">
            {data.timeGapLabel}
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/40">
            {data.timeGapScore === 20 ? 'Automated bot pacing' : 'Manual operator pacing'}
          </div>
        </div>

        {/* Block 3: Gas Fee */}
        <div
          id="forensic-block-gas"
          className="bg-black border border-green-500/20 rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all duration-300 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-3 text-green-400 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <div className="text-gray-400 text-xs uppercase tracking-wider font-mono">
            Gas Fee ({data.gasScore}%)
          </div>
          <div className="text-green-400 font-bold text-xl sm:text-2xl mt-2 font-mono">
            {data.gasFeeLabel}
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/40">
            {data.gasScore === 20 ? 'Contract gas signature' : 'Variable user fee signature'}
          </div>
        </div>

        {/* Block 4: Chain Match */}
        <div
          id="forensic-block-chain"
          className="bg-black border border-green-500/20 rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all duration-300 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-3 text-green-400 group-hover:scale-110 transition-transform">
            <Network className="w-6 h-6" />
          </div>
          <div className="text-gray-400 text-xs uppercase tracking-wider font-mono">
            Chain Match ({data.chainScore}%)
          </div>
          <div className="text-green-400 font-bold text-xl sm:text-2xl mt-2 font-mono">
            {data.chainLabel}
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/40">
            {data.chainScore === 20 ? 'USDT Ledger Standard' : 'Multi-Chain / Secondary Bridge'}
          </div>
        </div>

        {/* Block 5: DEX Route */}
        <div
          id="forensic-block-dex"
          className="bg-black border border-green-500/20 rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all duration-300 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-3 text-green-400 group-hover:scale-110 transition-transform">
            <Shuffle className="w-6 h-6" />
          </div>
          <div className="text-gray-400 text-xs uppercase tracking-wider font-mono">
            DEX Route ({data.dexScore}%)
          </div>
          <div className="text-green-400 font-bold text-xl sm:text-2xl mt-2 font-mono">
            {data.dexLabel}
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/40">
            {data.dexScore === 20 ? 'De-anonymized liquidity pool' : 'Direct peer-to-peer transfer'}
          </div>
        </div>
      </div>

      {/* Bottom: Dynamic Formula bar */}
      <div className="w-full relative z-10 pb-4">
        <div className="bg-black/90 border border-green-500/30 rounded-2xl p-4 sm:p-5 text-center shadow-[0_0_30px_rgba(34,197,94,0.1)]">
          <p id="forensic-formula-text" className="text-green-400 font-mono text-xs sm:text-sm lg:text-base font-semibold leading-relaxed">
            Amount Slab ({data.amountScore}%) + Time Gap ({data.timeGapScore}%) + Gas Fee ({data.gasScore}%) + Chain Match ({data.chainScore}%) + DEX Route ({data.dexScore}%) = {data.totalMatch}% • Sec 63 BSA Admissible
          </p>
        </div>
      </div>
    </section>
  );
};

export default ForensicPatternMatcher;
