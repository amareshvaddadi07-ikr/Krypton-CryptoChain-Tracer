import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export interface StepperStep {
  id: number;
  label: string;
  sublabel?: string;
  nodeIndex: number;
  isMixer?: boolean;
  isDex?: boolean;
  isVasp?: boolean;
  peelPercent?: number;
}

interface HorizontalScannerStepperProps {
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
  onMixerDetected?: () => void;
}

export const HorizontalScannerStepper: React.FC<HorizontalScannerStepperProps> = ({
  chain: _chain,
  wallet: _wallet,
  amount: _amount,
  firstLayerWallet: _firstLayerWallet,
  vaspName,
  hops,
  isDeep = false,
  nodes = [],
  scanKey,
  onStepReveal,
  onScanComplete,
  onMixerDetected,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [mixerDetectedAlert, setMixerDetectedAlert] = useState<boolean>(false);

  // Build dynamic steps based on hops count and node metadata
  const stepsConfig: StepperStep[] = React.useMemo(() => {
    if (!isDeep && hops <= 4) {
      const quickSteps: StepperStep[] = [
        {
          id: 1,
          label: 'Suspect Mempool',
          sublabel: 'Depth 0',
          nodeIndex: 0,
        },
      ];

      for (let i = 1; i < hops; i++) {
        quickSteps.push({
          id: i + 1,
          label: `Layer ${i}`,
          sublabel: `Depth ${i}`,
          nodeIndex: i,
        });
      }

      quickSteps.push({
        id: hops + 1,
        label: `${vaspName || 'WazirX'} (VASP)`,
        sublabel: 'Terminus Locked',
        nodeIndex: hops,
        isVasp: true,
      });

      return quickSteps;
    }

    // Deep Trace dynamic multi-hop BFS steps
    const deepSteps: StepperStep[] = [
      {
        id: 1,
        label: 'Suspect Root',
        sublabel: 'Depth 0',
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

      let label = `Depth ${i}`;
      let sublabel: string | undefined = undefined;

      if (isMixerNode) {
        label = `Depth ${i} MIXER`;
        sublabel = 'Obfuscation';
      } else if (isDexNode) {
        label = `Depth ${i} DEX`;
        sublabel = 'SunSwap Route';
      } else if (i === 1) {
        label = 'Depth 1 Layer';
        sublabel = 'Primary Exit';
      } else {
        label = `Depth ${i} Peel ${peelPct}%`;
        sublabel = 'Hop Analysis';
      }

      deepSteps.push({
        id: i + 1,
        label,
        sublabel,
        nodeIndex: i,
        isMixer: isMixerNode,
        isDex: isDexNode,
        peelPercent: peelPct,
      });
    }

    // Terminus step
    deepSteps.push({
      id: hops + 1,
      label: `${vaspName || 'WazirX'} VASP FOUND`,
      sublabel: `${hops} Hops`,
      nodeIndex: hops,
      isVasp: true,
    });

    return deepSteps;
  }, [isDeep, hops, vaspName, nodes]);

  useEffect(() => {
    setActiveStep(1);
    setCompletedSteps([]);
    setMixerDetectedAlert(false);

    if (stepsConfig.length === 0) return;

    onStepReveal?.(1, 0);

    const timeouts: NodeJS.Timeout[] = [];
    const stepDelay = isDeep ? 500 : 420;
    let accumulatedTime = 300;

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
    <div id="mempool-stepper-container" className="w-full relative z-[1] flex flex-col gap-2">
      {/* Warning banner above stepper */}
      {mixerDetectedAlert && (
        <motion.div
          id="mixer-warning-banner"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full px-3 py-1.5 rounded-lg bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-between text-[11px] text-[#A855F7] font-mono"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-pulse text-[#A855F7]" />
            <span className="font-semibold">Mixer obfuscation - switching to peel analysis</span>
          </div>
          <span className="text-[9.5px] uppercase tracking-wider text-[#A855F7]/80 px-2 py-0.5 rounded bg-[#A855F7]/20">
            AUTO-RESOLVING
          </span>
        </motion.div>
      )}

      {/* Horizontal Stepper Bar */}
      <div
        id="horizontal-stepper-bar"
        className="w-full min-h-[58px] px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex items-center justify-between gap-3 overflow-x-auto scrollbar-none select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
      >
        {/* Left header tag */}
        <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#F0FFF0] uppercase whitespace-nowrap">
              {isDeep ? `BFS (${hops} HOPS)` : 'BFS SCAN'}
            </span>
          </div>
          {isAllComplete && (
            <span className="px-1.5 py-0.5 rounded bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14] text-[8.5px] font-bold font-mono tracking-wider whitespace-nowrap shadow-[0_0_8px_rgba(57,255,20,0.3)]">
              LOCKED
            </span>
          )}
        </div>

        {/* Stepper items */}
        <div className="flex items-center gap-2 flex-1 justify-start overflow-x-auto scrollbar-none py-1">
          {stepsConfig.map((step, idx) => {
            const isDone = completedSteps.includes(step.id);
            const isCurrent = activeStep === step.id && !isDone;

            // Color scheme based on role
            let pillBg = 'bg-[#9D00FF]/5 border-[#9D00FF]/20 text-[#8BA88B]';
            let iconEl = <span className="w-2 h-2 rounded-full bg-[#9D00FF]/40" />;

            if (step.isMixer) {
              if (isDone) {
                pillBg = 'bg-[#9D00FF]/25 border-[#9D00FF]/60 text-[#D8B4FE] shadow-[0_0_12px_rgba(157,0,255,0.3)]';
                iconEl = <CheckCircle2 className="w-3.5 h-3.5 text-[#B026FF]" />;
              } else if (isCurrent) {
                pillBg = 'bg-[#9D00FF]/35 border-[#9D00FF] text-white shadow-[0_0_15px_rgba(157,0,255,0.5)] animate-pulse';
                iconEl = <Loader2 className="w-3.5 h-3.5 text-[#B026FF] animate-spin" />;
              } else {
                pillBg = 'bg-[#9D00FF]/10 border-[#9D00FF]/20 text-[#D8B4FE]/60';
              }
            } else if (step.isDex) {
              if (isDone) {
                pillBg = 'bg-[#00FF88]/20 border-[#00FF88]/50 text-[#7FFF67] shadow-[0_0_12px_rgba(0,255,136,0.25)]';
                iconEl = <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF88]" />;
              } else if (isCurrent) {
                pillBg = 'bg-[#00FF88]/30 border-[#00FF88] text-white shadow-[0_0_15px_rgba(0,255,136,0.4)] animate-pulse';
                iconEl = <Loader2 className="w-3.5 h-3.5 text-[#00FF88] animate-spin" />;
              } else {
                pillBg = 'bg-[#00FF88]/10 border-[#00FF88]/20 text-[#00FF88]/60';
              }
            } else if (step.isVasp) {
              if (isDone) {
                pillBg = 'bg-[#39FF14]/20 border-[#39FF14]/60 text-[#F0FFF0] shadow-[0_0_12px_rgba(57,255,20,0.3)]';
                iconEl = <ShieldCheck className="w-3.5 h-3.5 text-[#39FF14]" />;
              } else if (isCurrent) {
                pillBg = 'bg-[#39FF14]/30 border-[#39FF14] text-white shadow-[0_0_15px_rgba(57,255,20,0.5)] animate-pulse';
                iconEl = <Loader2 className="w-3.5 h-3.5 text-[#39FF14] animate-spin" />;
              } else {
                pillBg = 'bg-[#39FF14]/10 border-[#39FF14]/20 text-[#39FF14]/60';
              }
            } else {
              // Standard / Green ticks
              if (isDone) {
                pillBg = 'bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14]';
                iconEl = <CheckCircle2 className="w-3.5 h-3.5 text-[#39FF14]" />;
              } else if (isCurrent) {
                pillBg = 'bg-[#39FF14]/20 border-[#39FF14]/60 text-white animate-pulse';
                iconEl = <Loader2 className="w-3.5 h-3.5 text-[#39FF14] animate-spin" />;
              }
            }

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && (
                  <ArrowRight
                    className={`w-3 h-3 shrink-0 ${
                      completedSteps.includes(step.id) ? 'text-white/40' : 'text-white/10'
                    }`}
                  />
                )}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-mono whitespace-nowrap transition-all duration-200 shrink-0 ${pillBg}`}
                >
                  {iconEl}
                  <span className="font-semibold">{step.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
