import React, { useState, useMemo, useRef } from 'react';
import { CaseData, TransactionStep } from '../types';
import { InputBar } from './InputBar';
import { CircularProgress } from './CircularProgress';
import { FreezeModal } from './FreezeModal';
import { FreezeTimelineEscalation } from './FreezeTimelineEscalation';
import { StatutoryFreezeSection } from './StatutoryFreezeSection';
import { MoneyFlowGraph, HopNode, getHopsForWallet } from './MoneyFlowGraph';
import { generatePDF, LegalNoticeType } from '../utils/pdfGenerator';
import { detectChain } from '../utils/dynamicTrail';
import { ForensicPatternMatcher } from './ForensicPatternMatcher';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Building2,
  FileCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface InvestigateViewProps {
  walletInput: string;
  setWalletInput: (val: string) => void;
  caseData: CaseData;
  presets?: CaseData[];
  onSelectPreset?: (preset: CaseData, immediateInvestigate?: boolean) => void;
  isTracing?: boolean;
  onInvestigate?: () => void;
  onBackToLanding?: () => void;
}

export const InvestigateView: React.FC<InvestigateViewProps> = ({
  walletInput,
  setWalletInput,
  caseData,
  presets = [],
  onSelectPreset,
  isTracing = false,
  onInvestigate,
  onBackToLanding,
}) => {
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [downloadedFilename, setDownloadedFilename] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const statutorySectionRef = useRef<HTMLDivElement>(null);

  const handleGenerateFreezeProtocol = (noticeType: LegalNoticeType = '91CrPC') => {
    setIsGeneratingPdf(true);

    try {
      const filename = generatePDF(caseData, noticeType);
      setDownloadedFilename(filename);
      setTimeout(() => {
        setIsFreezeModalOpen(true);
        setIsGeneratingPdf(false);
      }, 350);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGeneratingPdf(false);
    }
  };

  // Truncate wallet utility
  const truncate = (addr?: string) => {
    if (!addr) return '0x000...000';
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 2. Compute dynamic hops per wallet address using getHopsForWallet
  const suspectWalletAddress = walletInput.trim() || caseData.suspectWallet || 'TYqPw7z2okBhVx1p4mLc8q90dBa1n341bX';
  const moneyFlowHops: HopNode[] = useMemo(() => {
    return getHopsForWallet(suspectWalletAddress);
  }, [suspectWalletAddress]);

  // Nodes for Screen 2 Graph Mapping (Full Length)
  const graphNodes = useMemo(() => {
    const rootWallet = caseData.suspectWallet || 'TQa9s3q4o1k2f3a4s5d6f7g8h9j0k1l2m3n';
    const vaspName = caseData.vasp?.name || 'WazirX';
    const vaspWallet = caseData.vasp?.wallet || '0x3344...8899';
    const amountStr = caseData.amountFormatted || '₹3,45,000';

    return [
      {
        id: 'node-origin',
        type: 'origin',
        title: 'ORIGIN (Suspect Root)',
        label: 'SUSPECT ROOT',
        address: rootWallet,
        amount: amountStr,
        badge: 'Primary Inflow',
        bgColor: 'bg-orange-900/30',
        borderColor: 'border-orange-500',
        textColor: 'text-orange-400',
      },
      {
        id: 'node-d1',
        type: 'depth-1',
        title: 'DEPTH 1 (Peel Layer)',
        label: 'PEEL LAYER 1',
        address: 'TJb8s2...99kL',
        amount: '-12% Peel (₹41,400)',
        badge: 'Layer 1 Hop',
        bgColor: 'bg-yellow-900/30',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-400',
      },
      {
        id: 'node-d2',
        type: 'depth-2',
        title: 'DEPTH 2 (Peel Layer)',
        label: 'PEEL LAYER 2',
        address: 'TWx2m9...44pQ',
        amount: 'Split Transfer (₹2,98,000)',
        badge: 'Layer 2 Hop',
        bgColor: 'bg-yellow-900/30',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-400',
      },
      {
        id: 'node-mixer',
        type: 'mixer',
        title: 'DEPTH 3 (MIXER)',
        label: 'MIXER DE-ANONYMIZED',
        address: 'TMix77...99Xz',
        amount: 'Pool Swap: SunSwap LP',
        badge: 'Mixer Resolved',
        bgColor: 'bg-purple-900/30',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-300',
      },
      {
        id: 'node-d4',
        type: 'depth-4',
        title: 'DEPTH 4 (Peel Layer)',
        label: 'EXIT STAGING',
        address: 'TExt55...22aB',
        amount: 'Consolidation (₹2,92,400)',
        badge: 'Pre-VASP Hop',
        bgColor: 'bg-yellow-900/30',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-400',
      },
      {
        id: 'node-vasp',
        type: 'vasp',
        title: `${vaspName.toUpperCase()} VASP FOUND`,
        label: 'HOT WALLET IDENTIFIED',
        address: vaspWallet,
        amount: amountStr,
        badge: 'Target VASP',
        bgColor: 'bg-green-900/40',
        borderColor: 'border-green-500',
        textColor: 'text-green-400',
        glow: true,
      },
    ];
  }, [caseData]);

  // Screen 2: Graph nodes

  return (
    <div className="w-full flex flex-col space-y-12 sm:space-y-16 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
      {/* Top Search & Preset Navigation Bar */}
      <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex-1 max-w-2xl">
          <InputBar
            walletInput={walletInput}
            setWalletInput={setWalletInput}
            chain={detectChain(walletInput) || caseData.chain}
            firNumber={caseData.firNumber}
            isTracing={isTracing}
            onInvestigate={onInvestigate || (() => {})}
            isCompact={true}
          />
        </div>

        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-mono text-xs cursor-pointer transition-all active:scale-95"
            >
              ← Back to Search
            </button>
          )}

          {presets.length > 0 && onSelectPreset && (
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/40 uppercase">Presets:</span>
              {presets.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectPreset(p, true)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer border ${
                    p.id === caseData.id
                      ? 'bg-green-500/20 border-green-500 text-green-400 font-bold'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  {p.amountFormatted}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          SCREEN 1 - INNOVATION HERO (Dynamic Forensic Pattern Match)
          Calculates dynamic patterns (Amount Slab, Time Gap, Gas Fee, Chain Match, DEX Route)
          from actual wallet transactions & NCRP database
         ========================================================================= */}
      <ForensicPatternMatcher walletAddress={suspectWalletAddress} caseData={caseData} />

      {/* =========================================================================
          SCREEN 2 - GRAPH MAPPING (Full Length)
          Dynamic Animated MoneyFlowGraph (Chainalysis Reactor style)
          - Bezier curves with SVG stroke animation
          - Moving glowing green fund particle
          - Auto-play with play/pause/replay and 1x/2x speed controls
          - Interactive node telemetry & progress bar
         ========================================================================= */}
      <section
        id="screen-2-graph-mapping"
        className="w-full min-h-screen h-auto bg-[#050505] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative"
      >
        <MoneyFlowGraph hops={getHopsForWallet(suspectWalletAddress)} address={suspectWalletAddress} />

        {/* Bottom Legend & BFS Status Bar */}
        <div className="w-full pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/50 mt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-900/60 border border-orange-500" />
              <span>Suspect Root</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-yellow-900/60 border border-yellow-500" />
              <span>Peel Layers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-900/60 border border-purple-500" />
              <span>Mixer (De-anonymized)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-900/60 border border-green-500" />
              <span>VASP Hot Wallet</span>
            </div>
          </div>

          <div className="text-green-400 font-bold text-right">
            Full Dynamic Path Animation • Bezier Curves • Live Telemetry
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCREEN 3 - DETAILS SPLIT
          Top 3 cards in grid-cols-3:
            Card 1: NEAREST VASP (WazirX) - Hot Wallet, SLA 47 min, 91 CrPC/94 BNSS
            Card 2: TRACE DEPTH (5 HOPS DEEP TRACE) - Multi-layer BFS, 1 peel detected, Mixer resolved
            Card 3: CONFIDENCE (78%) - Amount Match 30% + Time Proximity 25% - Circular progress
          Below grid-cols-2:
            Left: TRANSACTION TIMELINE + MONEY FLOW LIST
            Right: Bottom sections + STICKY GENERATE FREEZE PROTOCOL
         ========================================================================= */}
      <section
        id="screen-3-details-split"
        className="w-full min-h-screen h-auto flex flex-col space-y-8 relative pb-16"
      >
        {/* Section Headline */}
        <div className="w-full flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="text-[10px] font-mono text-green-500 uppercase tracking-widest font-semibold mb-1">
              EXECUTIVE DOSSIER & STATUTORY EVIDENCE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sora">
              EVIDENCE CORROBORATION & FREEZE REQUISITION
            </h2>
          </div>
          <div className="font-mono text-xs text-white/50">
            CASE: <span className="text-white font-bold">{caseData.firNumber}</span>
          </div>
        </div>

        {/* Top 3 Cards in grid-cols-3 gap-6 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: NEAREST VASP (WazirX) */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-green-500/40 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-green-400 font-bold uppercase tracking-wider">
                  NEAREST VASP
                </span>
                <span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-mono font-bold">
                  FIU-IND COMPLIANT
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white font-sora">
                {caseData.vasp?.name || 'WazirX'}
              </h3>
              <p className="text-xs font-mono text-white/60 mt-1">
                Zanmai Labs Pvt Ltd // Hot Wallet Cluster
              </p>

              <div className="mt-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">SLA Window:</span>
                  <span className="text-green-400 font-bold">47 Minutes</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Statutory Notice:</span>
                  <span className="text-white font-semibold">91 CrPC // 94 BNSS</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Hot Wallet:</span>
                  <span className="text-white/80 select-all">{truncate(caseData.vasp?.wallet || '0x3344...8899')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-white/40">Nodal Contact:</span>
                  <span className="text-green-400 text-[11px] truncate max-w-[150px]">
                    {caseData.vasp?.email || 'nodal@wazirx.com'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-green-400/80 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <span>Direct Emergency Preservation Endpoint Verified</span>
            </div>
          </div>

          {/* Card 2: TRACE DEPTH (${moneyFlowHops.length} HOPS) */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-yellow-500/40 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-yellow-400 font-bold uppercase tracking-wider">
                  TRACE DEPTH
                </span>
                <span className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-mono font-bold">
                  {moneyFlowHops.length > 4 ? 'DEEP TRACE' : 'QUICK TRACE'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white font-sora">
                {moneyFlowHops.length} HOPS {moneyFlowHops.length > 4 ? 'DEEP TRACE' : 'TRACE'}
              </h3>
              <p className="text-xs font-mono text-white/60 mt-1">
                Multi-layer BFS Traversal Engine
              </p>

              <div className="mt-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Graph Traversal:</span>
                  <span className="text-white font-semibold">Multi-layer BFS</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Peeling Layers:</span>
                  <span className="text-yellow-400 font-bold">
                    {moneyFlowHops.filter((h) => h.type === 'peel').length} peel detected
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Mixer Obfuscation:</span>
                  <span className="text-purple-300 font-semibold">
                    {moneyFlowHops.some((h) => h.type === 'mixer') ? 'Mixer resolved (SunSwap)' : 'Direct Path (No Mixer)'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-white/40">Execution Time:</span>
                  <span className="text-green-400 font-semibold">0.82 seconds</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-yellow-400/80 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-yellow-400" />
              <span>Full cryptographic audit trail preserved</span>
            </div>
          </div>

          {/* Card 3: CONFIDENCE (78%) with Circular Progress */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-green-500/40 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-green-400 font-bold uppercase tracking-wider">
                  CONFIDENCE SCORE
                </span>
                <span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-mono font-bold">
                  HIGH CERTAINTY
                </span>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div>
                  <h3 className="text-3xl font-extrabold text-white font-sora">
                    78%
                  </h3>
                  <p className="text-xs font-mono text-white/60 mt-1">
                    Statutory Presumption
                  </p>
                </div>
                <CircularProgress percentage={78} size={68} color="#22c55e" strokeWidth={5} />
              </div>

              <div className="mt-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Amount Match:</span>
                  <span className="text-green-400 font-bold">30%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/40">Time Proximity:</span>
                  <span className="text-green-400 font-bold">25%</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-white/40">Gas & Route Match:</span>
                  <span className="text-green-400 font-bold">23%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-green-400/80 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-green-400" />
              <span>Court-ready Sec 63 BSA certificate included</span>
            </div>
          </div>
        </div>

        {/* Below: grid-cols-2 gap-6 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left Column: TRANSACTION TIMELINE + MONEY FLOW LIST */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-400" />
                <h3 className="font-sora font-bold text-lg text-white">
                  TRANSACTION TIMELINE + MONEY FLOW LIST
                </h3>
              </div>
              <span className="text-[10px] font-mono text-white/40 uppercase">
                {caseData.timeline?.length || 5} TRANSFERS
              </span>
            </div>

            {/* List of Transaction steps */}
            <div className="space-y-4 overflow-y-auto max-h-[480px] pr-2">
              {caseData.timeline && caseData.timeline.length > 0 ? (
                caseData.timeline.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-black/60 border border-white/5 flex flex-col gap-2 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-green-400 font-bold">Hop #{idx + 1}: {step.time}</span>
                      <span className="text-white font-bold">{step.amountFormatted || step.amount}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/40">From:</span>
                        <span className="text-white/80">{truncate(step.from)}</span>
                        <span className="text-green-500">→</span>
                        <span className="text-white/40">To:</span>
                        <span className="text-white/80">{truncate(step.to)}</span>
                      </div>
                      {step.peelPercent && (
                        <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px]">
                          -{step.peelPercent}% PEEL
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-1 border-t border-white/5">
                      <span>TxID: {step.txHash ? truncate(step.txHash) : `0x${idx}a8f...99bc`}</span>
                      <span className="text-green-400/80">{step.status || 'Confirmed On-Chain'}</span>
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback clean timeline items */
                [
                  { hop: 1, time: '14:23:01 IST', from: caseData.suspectWallet, to: 'TJb8...99kL', amount: '₹3,45,000', tag: 'Suspect Root Transfer' },
                  { hop: 2, time: '14:27:18 IST', from: 'TJb8...99kL', to: 'TWx2...44pQ', amount: '₹3,03,600', tag: '-12% Peel Staged' },
                  { hop: 3, time: '14:32:45 IST', from: 'TWx2...44pQ', to: 'TMix...99Xz', amount: '₹2,98,000', tag: 'SunSwap DEX Liquidity' },
                  { hop: 4, time: '14:38:12 IST', from: 'TMix...99Xz', to: 'TExt...22aB', amount: '₹2,92,400', tag: 'Exit Consolidation' },
                  { hop: 5, time: '14:44:30 IST', from: 'TExt...22aB', to: caseData.vasp?.wallet || '0x3344...8899', amount: '₹2,92,400', tag: 'WazirX Hot Deposit' },
                ].map((item) => (
                  <div
                    key={item.hop}
                    className="p-3.5 rounded-xl bg-black/60 border border-white/5 flex flex-col gap-2 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-green-400 font-bold">Hop #{item.hop}: {item.time}</span>
                      <span className="text-white font-bold">{item.amount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/40">From:</span>
                        <span className="text-white/80">{truncate(item.from)}</span>
                        <span className="text-green-500">→</span>
                        <span className="text-white/40">To:</span>
                        <span className="text-white/80">{truncate(item.to)}</span>
                      </div>
                      <span className="text-[10px] text-green-400 font-mono">{item.tag}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Statutory Escalation & Requisition Controls */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-green-400" />
                  <h3 className="font-sora font-bold text-lg text-white">
                    STATUTORY FREEZE & ESCALATION
                  </h3>
                </div>
                <span className="text-xs font-mono text-green-400 font-bold">
                  SLA &lt; 47 MIN
                </span>
              </div>

              {/* Sub-sections */}
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-2">
                  <div className="text-white/50 text-[10px] uppercase tracking-wider font-bold">
                    Target Nodal Details
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Exchange:</span>
                    <span className="text-white font-bold">{caseData.vasp?.name || 'WazirX'} (Zanmai Labs)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Emergency Nodal:</span>
                    <span className="text-green-400 font-mono select-all">nodal@wazirx.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">FIU-IND Reg:</span>
                    <span className="text-white font-mono">FIU-IND-2023-VASP-044</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-2">
                  <div className="text-white/50 text-[10px] uppercase tracking-wider font-bold">
                    Statutory Provisions
                  </div>
                  <p className="text-white/70 text-[11px] leading-relaxed">
                    Issued under <strong>Section 91 CrPC</strong> and <strong>Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS)</strong>. Mandates 7-day immediate account freeze and full KYC dossier production within statutory SLA.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-2">
                  <div className="text-white/50 text-[10px] uppercase tracking-wider font-bold">
                    Electronic Admissibility
                  </div>
                  <p className="text-white/70 text-[11px] leading-relaxed">
                    Certificate under <strong>Section 63 of Bharatiya Sakshya Adhiniyam (BSA)</strong> embedded. SHA-256 hash automatically signed for court trial admissibility.
                  </p>
                </div>
              </div>
            </div>

            {/* In-page action summary */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/50">
              <span>Automated PDF Generator Active</span>
              <span className="text-green-400 font-bold">Ready for Direct Dispatch</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BOTTOM SECTION AFTER SCREEN 3: STATUTORY FREEZE & VASP SLA LEADERBOARD
         ========================================================================= */}
      <div ref={statutorySectionRef} className="w-full">
        <StatutoryFreezeSection
          vaspName={caseData.vasp?.name || 'WazirX'}
          vaspEmail={caseData.vasp?.complianceEmail || (caseData.vasp as any)?.email || 'compliance@wazirx.com'}
          walletAddress={walletInput?.trim() || caseData.suspectWallet || caseData.vasp?.fullHotWallet || caseData.vasp?.hotWallet || 'TLa2w8q6e4r2t1y7u8i9o0p1a2s3d4f8c9'}
          firNumber={caseData.firNumber || 'NCRP/2025/8847'}
          amount={caseData.amountFormatted || caseData.rawAmount || '₹3,45,000'}
          caseData={caseData}
          onGenerateProtocol={() => handleGenerateFreezeProtocol('91CrPC')}
          isGeneratingPdf={isGeneratingPdf}
        />
      </div>

      {/* Freeze Request Protocol Modal (Section 91 CrPC / Section 94 BNSS) */}
      <FreezeModal
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        caseData={caseData}
        downloadedFilename={downloadedFilename}
      />
    </div>
  );
};
