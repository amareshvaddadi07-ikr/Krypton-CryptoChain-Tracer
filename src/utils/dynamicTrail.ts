import { CaseData, TransactionStep } from '../types';

export interface DynamicTrailResult {
  nodes: any[];
  edges: any[];
  vasp: {
    name: string;
    wallet: string;
    email: string;
    fullWallet?: string;
    nodalEmail?: string;
    type?: string;
    sla?: string;
  };
  amount: number;
  finalAmount: number;
  confidence: number;
  hops: number;
  isDeep: boolean;
  peelingCount: number;
  inputWallet: string;
  chain: string;
  gasFees: number[];
  timeGaps: number[];
  avgTimeGap: number;
  chains: string[];
  hasDex: boolean;
  caseData: CaseData;
}

/**
 * Detect blockchain network from wallet address format
 */
export function detectChain(wallet: string): string {
  const trimmed = wallet.trim();
  if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) return 'ETH';
  if (trimmed.startsWith('bc1') || trimmed.startsWith('1') || trimmed.startsWith('3')) return 'BTC';
  if (trimmed.startsWith('T') || trimmed.startsWith('t')) return 'TRON';
  if (
    trimmed.toLowerCase().startsWith('sol') ||
    (trimmed.length >= 40 && !trimmed.startsWith('0x') && !trimmed.startsWith('T'))
  ) {
    return 'SOL';
  }
  return 'TRON';
}

/**
 * Seeded pseudorandom string generator for deterministic hashes
 */
function pseudoRandomString(seed: number, length: number): string {
  let s = Math.sin(seed) * 10000;
  let str = '';
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  for (let c = 0; c < length; c++) {
    s = Math.sin(s + c + 1) * 10000;
    const rnd = s - Math.floor(s);
    str += chars[Math.floor(rnd * chars.length)];
  }
  return str;
}

/**
 * UPGRADED DYNAMIC TRAIL GENERATOR:
 * Supports 2-4 Quick Hops and 5-10 Deep Hops with Mixer Obfuscation, DEX Swaps, and Peeling Chains.
 */
export function generateDynamicTrail(
  inputWallet: string,
  deepMode: boolean = false
): DynamicTrailResult {
  const cleanWallet = inputWallet.trim() || 'TQa9s3q4o1k2f3a4s5d6f7g8h9j0k1l2m3n';

  // Deterministic 32-bit integer hash from wallet string
  const hash = cleanWallet.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  const absHash = Math.abs(hash);

  // Determine hops: 2-4 for normal, 5-10 for deep mode or based on hash
  // If wallet length > 20 or hash % 3 == 0, make it deep 6-10 hops
  const isDeep = deepMode || absHash % 3 === 0 || cleanWallet.length > 30;
  const minHops = isDeep ? 5 : 2;
  const maxHops = isDeep ? 10 : 4;
  const hops = minHops + (absHash % (maxHops - minHops + 1)); // 5-10 for deep, 2-4 for quick

  const baseAmount = 150000 + (absHash % 500000); // 1.5L to 6.5L

  const vasps = [
    {
      name: 'WazirX',
      wallet: 'TLa2w8q6e4r2t1y7u8i9o0p1a2s3d4f8c9',
      email: 'compliance@wazirx.com',
      fullWallet: 'TLa2w8q6e4r2t1y7u8i9o0p1a2s3d4f8c9',
      nodalEmail: 'nodalofficer@wazirx.com',
      sla: '47 min',
      type: 'exchange',
    },
    {
      name: 'Binance',
      wallet: 'TQb9x...BinanceHot',
      email: 'compliance@binance.com',
      fullWallet: 'TQb9BinanceHotWallet8x92k1l2m3n4p5q6',
      nodalEmail: 'lawenforcement@binance.com',
      sla: '4 min',
      type: 'exchange',
    },
    {
      name: 'CoinDCX',
      wallet: 'TLc3...CoinDCX',
      email: 'compliance@coindcx.com',
      fullWallet: 'TLc3CoinDCXHotWallet7v8w9x0y1z2a3b4c',
      nodalEmail: 'nodal@coindcx.com',
      sla: '2h 14m',
      type: 'exchange',
    },
    {
      name: 'SunSwap DEX',
      wallet: 'TSun...SwapRouter',
      email: 'support@sunswap.com',
      fullWallet: 'TSunSwapRouterDeFiPool8x112233',
      nodalEmail: 'security@sunswap.com',
      sla: 'N/A (Smart Contract)',
      type: 'dex',
    },
    {
      name: 'TRON Mixer',
      wallet: 'TMix...Obfuscator',
      email: 'mixer@tronpool.io',
      fullWallet: 'TMixTornadoStyleSmartContract0099',
      nodalEmail: 'security@tronpool.io',
      sla: 'N/A (Smart Contract)',
      type: 'mixer',
    },
  ];

  // VASP always at last hop, but for deep, intermediate hops include DEX/Mixer decoys
  const finalVasp = vasps[absHash % 3]; // Only real exchanges at end: WazirX / Binance / CoinDCX
  const detectedChain = detectChain(cleanWallet);
  const prefix = cleanWallet.startsWith('0x')
    ? '0x'
    : cleanWallet.startsWith('bc1')
    ? 'bc1q'
    : 'T';

  // Deterministic gas fingerprint and time gaps across hops
  const gasFees = Array(hops).fill(0.25 + (absHash % 4) / 100);
  const timeGaps = Array(hops - 1)
    .fill(0)
    .map(() => 120 + (absHash % 120));
  const avgTimeGap =
    timeGaps.length > 0 ? timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length : 180;
  const chains = isDeep ? ['TRON', 'ETH'] : ['TRON'];

  // Short preview of suspect wallet
  const prev =
    cleanWallet.length > 12
      ? cleanWallet.slice(0, 6) + '...' + cleanWallet.slice(-4)
      : cleanWallet;

  // ReactFlow nodes & edge arrays
  const nodes: any[] = [];
  const edges: any[] = [];
  const timeline: TransactionStep[] = [];

  const firNumber = 'NCRP/2025/8847';
  let currentAmount = baseAmount;
  let peelingCount = 0;

  // Horizontal spacing layout: 250px apart
  const nodeSpacingX = 280;
  const startX = 80;
  const posY = 170;

  // Node 0: Scammer (Suspect)
  nodes.push({
    id: '0',
    type: 'scammer',
    position: { x: startX, y: posY },
    label: prev,
    amount: currentAmount,
    data: {
      label: prev,
      subLabel: 'Scammer (Suspect Root)',
      wallet: cleanWallet,
      amount: `₹${currentAmount.toLocaleString('en-IN')} USDT`,
      category: 'scammer',
    },
  });

  // Timeline Step 0 (Victim -> Scammer)
  timeline.push({
    time: '10:14 AM',
    from: 'Victim (Citizen Account)',
    to: prev,
    amount: `₹${currentAmount.toLocaleString('en-IN')} USDT`,
    txHash: '0x' + pseudoRandomString(absHash + 1, 8) + '...' + pseudoRandomString(absHash + 2, 4),
    tag: 'Primary Phish / Social Engineering Inflow',
  });

  let previousShort = prev;

  // Middle hops: peeling chain, mixing patterns & DEX swaps
  for (let i = 1; i < hops; i++) {
    const isDecoy = isDeep && i > 1 && i < hops - 1 && (absHash + i) % 3 === 0;
    if (isDecoy) peelingCount++;

    // Mixer peels 15-25%, normal peeling chain 2-5%
    const peelPercent = isDecoy
      ? 0.15 + ((absHash + i) % 10) / 100
      : 0.02 + ((absHash + i) % 3) / 100;
    const nextAmount = Math.floor(currentAmount * (1 - peelPercent));

    // Wallet prefix and naming
    let walletPrefix = 'T';
    let nodeType: 'layer' | 'mixer' | 'dex' = 'layer';
    let tagDetail = `Layer ${i} Mule`;

    if (isDecoy) {
      if ((absHash + i) % 2 === 0) {
        walletPrefix = 'TSun...';
        nodeType = 'dex';
        tagDetail = 'SunSwap DEX - Kryptonite DEX Poison';
      } else {
        walletPrefix = 'TMix...';
        nodeType = 'mixer';
        tagDetail = 'TRON Mixer - Purple Haze Obfuscation';
      }
    } else {
      walletPrefix = `${prefix}${pseudoRandomString(absHash + i * 19, 4)}...`;
    }

    const walletSuffix = pseudoRandomString(absHash + i * 37, 4);
    const layerWallet = isDecoy ? `${walletPrefix}${walletSuffix}` : `${walletPrefix}${walletSuffix}`;
    const hopTime = `${10 + Math.floor((14 + i * 3) / 60)}:${String((14 + i * 3) % 60).padStart(2, '0')} AM`;
    const formattedNext = `₹${nextAmount.toLocaleString('en-IN')} USDT`;

    const nodeRole = isDecoy
      ? nodeType === 'dex'
        ? 'SunSwap DEX - Kryptonite DEX Poison'
        : 'TRON Mixer - Purple Haze Obfuscation'
      : `Layer ${i} Mule`;

    nodes.push({
      id: `${i}`,
      type: nodeType,
      position: { x: startX + i * nodeSpacingX, y: posY },
      label: layerWallet,
      amount: nextAmount,
      data: {
        label: layerWallet,
        subLabel: nodeRole,
        wallet: layerWallet,
        amount: formattedNext,
        category: nodeType,
        isMixer: nodeType === 'mixer',
        isDex: nodeType === 'dex',
        peelPercent: Math.round(peelPercent * 100),
      },
    });

    const edgeColor =
      nodeType === 'mixer' ? '#9D00FF' : nodeType === 'dex' ? '#00FF88' : '#39FF14';

    edges.push({
      id: `e${i - 1}-${i}`,
      source: `${i - 1}`,
      target: `${i}`,
      from: `${i - 1}`,
      to: `${i}`,
      label: `₹${nextAmount.toLocaleString('en-IN')} - ${
        isDecoy ? 'PEEL ' + Math.round(peelPercent * 100) + '%' : '+2 mins'
      }`,
      isPeel: isDecoy,
      type: 'travelingDotEdge',
      data: {
        amount: formattedNext,
        time: hopTime,
        color: edgeColor,
        isPeel: isDecoy,
      },
    });

    timeline.push({
      time: hopTime,
      from: previousShort,
      to: layerWallet,
      amount: formattedNext,
      txHash:
        '0x' + pseudoRandomString(absHash + i * 47, 8) + '...' + pseudoRandomString(absHash + i * 49, 4),
      tag: isDecoy
        ? nodeType === 'mixer'
          ? `[OBFUSCATION] TRON Mixer - Purple Haze Obfuscation (-${Math.round(peelPercent * 100)}% Peel)`
          : `[DEFI SWAP] SunSwap DEX - Kryptonite DEX Poison (-${Math.round(peelPercent * 100)}%)`
        : `Intermediate Mule Layer ${i} Peel Relay`,
      isPeel: isDecoy,
      isMixer: nodeType === 'mixer',
      isDex: nodeType === 'dex',
      peelPercent: Math.round(peelPercent * 100),
    });

    currentAmount = nextAmount;
    previousShort = layerWallet;
  }

  // Final VASP Node (Terminus Exchange to Freeze)
  const finalAmount = currentAmount;
  const finalAmountFormatted = `₹${finalAmount.toLocaleString('en-IN')} USDT`;
  const freezeTime = `${10 + Math.floor((14 + hops * 3 + 2) / 60)}:${String(
    (14 + hops * 3 + 2) % 60
  ).padStart(2, '0')} AM`;

  const vaspDisplayWallet =
    finalVasp.wallet.length > 14
      ? finalVasp.wallet.slice(0, 6) + '...' + finalVasp.wallet.slice(-4)
      : finalVasp.wallet;

  nodes.push({
    id: `${hops}`,
    type: 'vasp',
    position: { x: startX + hops * nodeSpacingX, y: posY },
    label: `${finalVasp.name} Hot Wallet`,
    name: finalVasp.name,
    amount: finalAmount,
    data: {
      label: `${finalVasp.name} Hot Wallet`,
      subLabel: `EXCHANGE • Freeze Target (${vaspDisplayWallet})`,
      wallet: finalVasp.fullWallet || finalVasp.wallet,
      amount: finalAmountFormatted,
      category: 'exchange',
      isTarget: true,
    },
  });

  edges.push({
    id: `e${hops - 1}-${hops}`,
    source: `${hops - 1}`,
    target: `${hops}`,
    from: `${hops - 1}`,
    to: `${hops}`,
    label: `₹${finalAmount.toLocaleString('en-IN')} - FINAL FREEZE`,
    isFreeze: true,
    type: 'travelingDotEdge',
    data: {
      amount: finalAmountFormatted,
      time: freezeTime,
      color: '#9D00FF',
    },
  });

  timeline.push({
    time: freezeTime,
    from: previousShort,
    to: `${finalVasp.name} (${vaspDisplayWallet})`,
    amount: finalAmountFormatted,
    txHash:
      '0x' + pseudoRandomString(absHash + 189, 8) + '...' + pseudoRandomString(absHash + 191, 4),
    isTarget: true,
    tag: 'FREEZE TARGET // Off-ramp Terminal Hot Wallet Deposit',
  });

  // Confidence is lower for deep traces (68-88%) to reflect realistic multi-hop variance
  const confidence = isDeep ? 68 + (absHash % 20) : 75 + (absHash % 18);

  const confidenceBreakdown = isDeep
    ? `Amount Match 28% + Time Proximity 22% + VASP Tag 20% - Mixer/Peel Variance ${
        peelingCount * 2
      }% = ${confidence}%`
    : `Amount Match 30% + Time Proximity 30% + VASP Tag 20% - Peeling 2% = ${confidence}%`;

  const hopsText = isDeep ? `${hops} HOPS (DEEP TRACE)` : `${hops} HOPS`;

  const caseData: CaseData = {
    id: `case-dyn-${absHash}${isDeep ? '-deep' : ''}`,
    title: `Suspect Search: ${prev} (${firNumber})`,
    amountFormatted: `₹${(baseAmount / 100000).toFixed(2)} Lakhs`,
    rawAmount: `₹${baseAmount.toLocaleString('en-IN')}`,
    firNumber,
    suspectWallet: cleanWallet,
    chain: detectedChain,
    isDeep,
    peelingCount,
    finalAmount,
    baseAmount,
    vasp: {
      name: finalVasp.name,
      hotWallet: vaspDisplayWallet,
      fullHotWallet: finalVasp.fullWallet || finalVasp.wallet,
      complianceEmail: finalVasp.email,
      nodalEmail: finalVasp.nodalEmail || `nodal@${finalVasp.name.toLowerCase()}.com`,
      ccEmail: 'cybercrime@gov.in, fiu@fiuindia.gov.in, 1930@i4c.gov.in',
      hops,
      hopsText,
      confidence,
      breakdown: confidenceBreakdown,
      fiuRegistration: `FIU-IND-REG-${finalVasp.name.toUpperCase()}-${(absHash % 899) + 100}`,
    },
    timeline,
    riskBadge: isDeep
      ? 'MULTI-HOP PEELING & MIXER OBFUSCATION DETECTED // 91 CrPC EMERGENCY FREEZE'
      : 'RAPID DISPERSION - IMMEDIATE 91 CrPC COLD FREEZE',
    txHash: '0x' + pseudoRandomString(absHash + 7, 32),
    investigationTimestamp: `${freezeTime} IST - 04 Sep 2026`,
    gasFees,
    timeGaps,
    avgTimeGap,
    chains,
    hasDex: nodes.some((n) => n.type === 'dex'),
    nodes,
    edges,
  };

  const hasDex = nodes.some((n) => n.type === 'dex');

  return {
    nodes,
    edges,
    vasp: finalVasp,
    amount: baseAmount,
    finalAmount,
    confidence,
    hops,
    isDeep,
    peelingCount,
    inputWallet: cleanWallet,
    chain: detectedChain,
    gasFees,
    timeGaps,
    avgTimeGap,
    chains,
    hasDex,
    caseData,
  };
}

// Bind to window for DevTools / console testing during live evaluations
if (typeof window !== 'undefined') {
  (window as any).generateDynamicTrail = generateDynamicTrail;
}
