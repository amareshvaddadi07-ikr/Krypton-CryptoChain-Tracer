import React, { useState } from 'react';
import { TransactionStep } from '../types';
import { Clock, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimelineCardProps {
  timeline: TransactionStep[];
  riskBadge: string;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({
  timeline,
  riskBadge,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldCollapse = timeline.length > 5;
  const visibleSteps = React.useMemo(() => {
    if (!shouldCollapse || isExpanded) {
      return timeline.map((step, originalIndex) => ({ step, originalIndex }));
    }
    // First 2 and last 2 items
    const firstTwo = timeline.slice(0, 2).map((step, idx) => ({ step, originalIndex: idx }));
    const lastTwo = timeline.slice(-2).map((step, idx) => ({
      step,
      originalIndex: timeline.length - 2 + idx,
    }));
    return { firstTwo, lastTwo, hiddenCount: timeline.length - 4 };
  }, [timeline, shouldCollapse, isExpanded]);

  const renderStep = (step: TransactionStep, idx: number, isLast: boolean) => {
    const isTarget = step.isTarget;
    const isMixer = step.isMixer;
    const isDex = step.isDex;

    return (
      <div key={idx} className="relative mb-3.5 last:mb-0">
        {/* Node dot on the vertical line */}
        <div
          className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#050507] ${
            isTarget
              ? 'bg-[#FF2A2A] shadow-[0_0_10px_#FF2A2A]'
              : isMixer
              ? 'bg-[#A855F7] shadow-[0_0_10px_#A855F7]'
              : isDex
              ? 'bg-[#3B82F6] shadow-[0_0_10px_#3B82F6]'
              : 'bg-white/40'
          }`}
        />

        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[9px] font-mono ${
              isTarget
                ? 'text-[#FF2A2A] font-bold'
                : isMixer
                ? 'text-[#A855F7]'
                : isDex
                ? 'text-[#3B82F6]'
                : 'text-white/40'
            }`}
          >
            {step.time}
          </span>
          <div className="flex items-center gap-1.5">
            {step.peelPercent && (
              <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-white/10 text-white/60">
                -{step.peelPercent}% PEEL
              </span>
            )}
            <span
              className={`font-mono text-xs font-bold ${
                isTarget ? 'text-[#FF2A2A]' : 'text-white'
              }`}
            >
              {step.amount}
            </span>
          </div>
        </div>

        {/* Transfer flow */}
        <div className="text-[11px] font-semibold text-white/80 tracking-tight mt-0.5 break-all">
          {step.from} → {step.to}
        </div>

        {/* Optional tag info */}
        {step.tag && (
          <div
            className={`text-[9.5px] font-mono mt-0.5 ${
              isMixer
                ? 'text-[#C084FC]'
                : isDex
                ? 'text-[#60A5FA]'
                : isTarget
                ? 'text-[#FF2A2A]'
                : 'text-white/50'
            }`}
          >
            {step.tag}
          </div>
        )}

        <div className="text-[9px] font-mono text-white/30 mt-0.5 truncate">
          TX: {step.txHash}
        </div>

        {isTarget && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-[#FF2A2A]/10 border border-[#FF2A2A]/20 rounded text-[9px] text-[#FF2A2A] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A] animate-ping" />
            <span>Action: Freeze Request (91 CrPC)</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Timeline Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl flex flex-col shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex-1 overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
          <div className="text-[10px] font-mono text-white/30 tracking-widest uppercase">
            TRANSACTION TIMELINE
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-[#39FF14] px-2 py-0.5 rounded bg-[#39FF14]/10 border border-[#39FF14]/20 font-bold uppercase">
              {timeline.length} HOPS
            </span>
          </div>
        </div>

        {/* Vertical Timeline */}
        <div className="relative flex-1 flex flex-col justify-start py-1 pl-4 border-l border-white/10 ml-2 overflow-y-auto max-h-[380px] scrollbar-thin scrollbar-thumb-white/10">
          {!shouldCollapse || isExpanded ? (
            (visibleSteps as Array<{ step: TransactionStep; originalIndex: number }>).map(
              ({ step, originalIndex }, idx) =>
                renderStep(step, originalIndex, idx === timeline.length - 1)
            )
          ) : (
            <>
              {/* First 2 */}
              {(visibleSteps as any).firstTwo.map(
                ({ step, originalIndex }: any) => renderStep(step, originalIndex, false)
              )}

              {/* Collapsed Middle Indicator */}
              <div className="my-2 py-1.5 px-2.5 rounded-lg bg-white/5 border border-dashed border-white/20 text-center">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="w-full text-[10px] font-mono text-[#39FF14] hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ChevronDown className="w-3 h-3" />
                  <span>
                    ... {(visibleSteps as any).hiddenCount} intermediate hops (peeling pattern) - Click to expand
                  </span>
                </button>
              </div>

              {/* Last 2 */}
              {(visibleSteps as any).lastTwo.map(
                ({ step, originalIndex }: any, idx: number) =>
                  renderStep(step, originalIndex, idx === 1)
              )}
            </>
          )}
        </div>

        {/* Collapse button when expanded */}
        {shouldCollapse && isExpanded && (
          <div className="pt-2 border-t border-white/5 text-center">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-[10px] font-mono text-white/50 hover:text-white flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <ChevronUp className="w-3 h-3" />
              <span>Collapse intermediate hops</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Risk Badge */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="p-4 bg-[#FF2A2A]/10 border border-[#FF2A2A]/20 rounded-2xl backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,42,42,0.1)]"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 bg-[#FF2A2A] rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-[#FF2A2A] uppercase tracking-wider">
            High Priority Threat
          </span>
        </div>
        <div className="text-[11px] font-medium text-white/80 leading-tight">
          {riskBadge}
        </div>
      </motion.div>
    </div>
  );
};
