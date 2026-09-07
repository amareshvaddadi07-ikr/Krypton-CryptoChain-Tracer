import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Loader2,
  Terminal,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export interface ScannerStep {
  id: number;
  text: string;
  nodeIndex: number;
  isMixer?: boolean;
  isDex?: boolean;
  isVasp?: boolean;
}

interface LiveScannerTerminalProps {
  chain: string;
  wallet: string;
  amount: number | string;
  firstLayerWallet: string;
  vaspName: string;
  hops: number;
  isDeep?: boolean;
  nodes?: any[];
  scanKey: number;
  onStepReveal?: (step: number, nodeIndex: number, isMixer?: boolean) => void;
  onScanComplete?: () => void;
  onReplayScan?: () => void;
  onMixerDetected?: () => void;
}

export const LiveScannerTerminal: React.FC<LiveScannerTerminalProps> = ({
  chain,
  wallet,
  amount,
  firstLayerWallet,
  vaspName,
  hops,
  isDeep = false,
  nodes = [],
  scanKey,
  onStepReveal,
  onScanComplete,
  onReplayScan,
  onMixerDetected,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [mixerDetectedAlert, setMixerDetectedAlert] = useState<boolean>(false);

  const safeWallet = wallet || '';
  const safeLayerWallet = firstLayerWallet || '';
  const cleanWalletPreview =
    safeWallet.length > 12 ? `${safeWallet.slice(0, 6)}...${safeWallet.slice(-4)}` : safeWallet;
  const cleanLayerPreview =
    safeLayerWallet.length > 12
      ? `${safeLayerWallet.slice(0, 6)}...${safeLayerWallet.slice(-4)}`
      : safeLayerWallet;
  const formattedAmount =
    typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : amount;

  // Build dynamic steps based on hops count and node metadata
  const stepsConfig: ScannerStep[] = React.useMemo(() => {
    if (!isDeep && hops <= 4) {
      return [
        {
          id: 1,
          text: `Scanning ${chain || 'TRON'} mempool for wallet ${cleanWalletPreview}...`,
          nodeIndex: 0,
        },
        {
          id: 2,
          text: `Found 1 outgoing tx: ${formattedAmount} to layer wallet ${cleanLayerPreview}...`,
          nodeIndex: 1,
        },
        {
          id: 3,
          text: `Expanding ${hops > 2 ? '2 hops' : '1 hop'}... Analyzing mixing patterns...`,
          nodeIndex: hops > 2 ? 2 : 1,
        },
        {
          id: 4,
          text: `Found link to VASP: ${vaspName || 'WazirX'} Hot Wallet at ${hops} hops`,
          nodeIndex: hops,
          isVasp: true,
        },
      ];
    }

    // Deep Trace dynamic multi-hop BFS steps
    const deepSteps: ScannerStep[] = [
      {
        id: 1,
        text: `Scanning ${chain || 'TRON'} mempool for suspect ${cleanWalletPreview}...`,
        nodeIndex: 0,
      },
    ];

    for (let i = 1; i < hops; i++) {
      const node = nodes[i];
      const nodeData = node?.data;
      const isMixerNode =
        nodeData?.category === 'mixer' || node?.type === 'mixer' || Boolean(nodeData?.isMixer);
      const isDexNode =
        nodeData?.category === 'dex' || node?.type === 'dex' || Boolean(nodeData?.isDex);
      const peelPct = nodeData?.peelPercent || 3;

      let stepText = '';
      if (isMixerNode) {
        stepText = `Depth ${i}: MIXER DETECTED! Tracing through mixer obfuscator...`;
      } else if (isDexNode) {
        stepText = `Depth ${i}: DEX hop SunSwap detected... Analyzing liquidity route...`;
      } else if (i === 1) {
        stepText = `Depth 1: Found layer 1 ${cleanLayerPreview}...`;
      } else {
        stepText = `Depth ${i}: Peeling detected ${peelPct}%... Tracing downstream...`;
      }

      deepSteps.push({
        id: i + 1,
        text: stepText,
        nodeIndex: i,
        isMixer: isMixerNode,
        isDex: isDexNode,
      });
    }

    // Terminus step
    deepSteps.push({
      id: hops + 1,
      text: `Depth ${hops}: VASP FOUND at ${hops} hops -> ${vaspName || 'WazirX'} Hot Wallet!`,
      nodeIndex: hops,
      isVasp: true,
    });

    return deepSteps;
  }, [isDeep, hops, chain, cleanWalletPreview, cleanLayerPreview, formattedAmount, vaspName, nodes]);

  useEffect(() => {
    // Reset state on scanKey change
    setActiveStep(1);
    setCompletedSteps([]);
    setMixerDetectedAlert(false);

    if (stepsConfig.length === 0) return;

    onStepReveal?.(1, 0);

    const timeouts: NodeJS.Timeout[] = [];
    const stepDelay = isDeep ? 550 : 450;
    let accumulatedTime = 400;

    stepsConfig.forEach((step, idx) => {
      if (idx === 0) {
        const t = setTimeout(() => {
          setCompletedSteps((prev) => [...prev, step.id]);
          if (stepsConfig[1]) {
            setActiveStep(stepsConfig[1].id);
            onStepReveal?.(stepsConfig[1].id, stepsConfig[1].nodeIndex, stepsConfig[1].isMixer);
          }
        }, accumulatedTime);
        timeouts.push(t);
        return;
      }

      accumulatedTime += stepDelay;

      const t = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, step.id]);

        if (step.isMixer) {
          setMixerDetectedAlert(true);
          onMixerDetected?.();
        }

        const nextStep = stepsConfig[idx + 1];
        if (nextStep) {
          setActiveStep(nextStep.id);
          onStepReveal?.(nextStep.id, nextStep.nodeIndex, nextStep.isMixer);
        } else {
          // Finished all steps
          setActiveStep(step.id + 1);
          onStepReveal?.(step.id + 1, step.nodeIndex, false);
          onScanComplete?.();
        }
      }, accumulatedTime);

      timeouts.push(t);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [scanKey, stepsConfig, isDeep]);

  const isAllComplete = completedSteps.length >= stepsConfig.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute top-3 left-3 z-30 w-72 sm:w-88 max-w-[calc(100%-24px)] rounded-xl overflow-hidden bg-[#0A110A]/95 border border-[#39FF14]/30 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(57,255,20,0.1)] flex flex-col font-mono select-none"
    >
      {/* Terminal Title Bar */}
      <div className="px-3 py-2 bg-[#050805]/80 border-b border-[#39FF14]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF00A8] inline-block shadow-[0_0_6px_#FF00A8]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#9D00FF] inline-block shadow-[0_0_6px_#9D00FF]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14] inline-block shadow-[0_0_6px_#39FF14]" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] tracking-tight font-semibold text-[#F0FFF0] ml-1">
            <Terminal className="w-3 h-3 text-[#39FF14]" />
            <span>{isDeep ? `DEEP MEMPOOL BFS (${hops} HOPS)` : 'KRYPTON MEMPOOL SCAN'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isAllComplete && (
            <span className="px-1.5 py-0.5 rounded bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14] text-[8.5px] font-bold tracking-wider shadow-[0_0_8px_rgba(57,255,20,0.3)]">
              TERMINUS LOCKED
            </span>
          )}
          <button
            onClick={() => setIsMinimized((prev) => !prev)}
            className="p-1 hover:bg-[#39FF14]/15 rounded text-[#8BA88B] hover:text-white transition-colors cursor-pointer"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Mixer Detection Banner Alert */}
      {mixerDetectedAlert && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-3 py-1.5 bg-[#9D00FF]/25 border-b border-[#9D00FF]/40 flex items-center gap-2 text-[10px] text-[#D8B4FE]"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-pulse text-[#B026FF]" />
          <span className="font-bold">Mixer obfuscation - switching to peel analysis</span>
        </motion.div>
      )}

      {/* Terminal Body */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 space-y-2 overflow-y-auto max-h-[300px] text-[11px] scrollbar-thin scrollbar-thumb-[#39FF14]/20"
          >
            {stepsConfig.map((step) => {
              const isVisible = activeStep >= step.id;
              const isDone = completedSteps.includes(step.id);
              const isCurrent = activeStep === step.id && !isDone;

              if (!isVisible) return null;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 leading-tight"
                >
                  <div className="shrink-0 mt-0.5">
                    {isDone ? (
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          step.isMixer
                            ? 'text-[#B026FF] drop-shadow-[0_0_6px_#9D00FF]'
                            : step.isDex
                            ? 'text-[#00FF88] drop-shadow-[0_0_6px_#00FF88]'
                            : 'text-[#39FF14] drop-shadow-[0_0_6px_#39FF14]'
                        }`}
                      />
                    ) : isCurrent ? (
                      <Loader2
                        className={`w-3.5 h-3.5 animate-spin ${
                          step.isMixer
                            ? 'text-[#B026FF]'
                            : 'text-[#39FF14] drop-shadow-[0_0_6px_#39FF14]'
                        }`}
                      />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block" />
                    )}
                  </div>

                  <div className="flex-1">
                    <span
                      className={
                        isDone
                          ? step.isMixer
                            ? 'text-[#D8B4FE] font-semibold'
                            : step.isDex
                            ? 'text-[#7FFF67] font-semibold'
                            : 'text-[#F0FFF0]/90'
                          : isCurrent
                          ? 'text-white font-semibold'
                          : 'text-[#8BA88B]'
                      }
                    >
                      {step.text}
                    </span>
                    {isCurrent && (
                      <span className="inline-block w-1.5 h-3 bg-[#39FF14] ml-1 animate-pulse align-middle shadow-[0_0_6px_#39FF14]" />
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Bottom Status / Replay CTA */}
            {isAllComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pt-2 mt-1 border-t border-[#39FF14]/15 flex items-center justify-between text-[10px]"
              >
                <div className="flex items-center gap-1 text-[#39FF14]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#39FF14]" />
                  <span className="font-semibold">VASP IDENTIFIED ({hops} HOPS)</span>
                </div>

                {onReplayScan && (
                  <button
                    onClick={onReplayScan}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#39FF14]/15 hover:bg-[#39FF14]/25 text-[#39FF14] font-mono text-[9.5px] font-bold transition-all cursor-pointer border border-[#39FF14]/30 active:scale-95 shadow-[0_0_8px_rgba(57,255,20,0.2)]"
                  >
                    <RotateCcw className="w-3 h-3 text-[#39FF14]" />
                    <span>REPLAY SCAN</span>
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
