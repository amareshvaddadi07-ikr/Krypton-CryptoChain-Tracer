import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Skull, Layers, Landmark, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';

export interface CustomNodeData {
  label: string;
  subLabel: string;
  wallet: string;
  amount: string;
  category: 'scammer' | 'layer' | 'exchange' | 'mixer' | 'dex';
  isTarget?: boolean;
  isMixer?: boolean;
  isDex?: boolean;
  peelPercent?: number;
}

export const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;

  const isScammer =
    nodeData.category === 'scammer' ||
    (data as any)?.type === 'scammer' ||
    (data as any)?.typeCategory === 'scammer';
  const isMixer =
    nodeData.category === 'mixer' ||
    (data as any)?.type === 'mixer' ||
    Boolean(nodeData.isMixer);
  const isDex =
    nodeData.category === 'dex' ||
    (data as any)?.type === 'dex' ||
    Boolean(nodeData.isDex);
  const isExchange =
    nodeData.category === 'exchange' ||
    (data as any)?.type === 'vasp' ||
    (data as any)?.typeCategory === 'vasp' ||
    Boolean(nodeData.isTarget);
  const isLayer = !isScammer && !isMixer && !isDex && !isExchange;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 18,
        mass: 0.8,
      }}
      className="relative flex flex-col items-center group cursor-grab active:cursor-grabbing select-none"
    >
      {/* Target input handle (left) */}
      {!isScammer && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !bg-white/40 !border-none !-left-1"
        />
      )}

      {/* Main Node Circle Container */}
      <div className="relative flex items-center justify-center">
        {/* Radar Scanning Ring on Scammer Suspect Node - Kryptonite Green */}
        {isScammer && (
          <>
            <div className="absolute -inset-3 rounded-full border border-[#39FF14]/50 animate-ping pointer-events-none" />
            <div className="absolute -inset-6 rounded-full border border-[#39FF14]/25 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Mixer Ring Alert - Toxic Purple */}
        {isMixer && (
          <>
            <div className="absolute -inset-3 rounded-full border border-[#9D00FF]/60 animate-ping pointer-events-none" />
            <div className="absolute -inset-6 rounded-full border border-[#9D00FF]/35 animate-pulse pointer-events-none" />
          </>
        )}

        {/* DEX Ring Alert - Cyan-Green */}
        {isDex && (
          <div className="absolute -inset-2.5 rounded-full border border-[#00FF88]/40 animate-pulse pointer-events-none" />
        )}

        {/* Infinite Sonar Rings for Exchange Target - Green + Purple Alternating */}
        {isExchange && (
          <>
            <div className="absolute -inset-3 rounded-full border-2 border-[#39FF14] animate-sonar pointer-events-none" />
            <div
              className="absolute -inset-6 rounded-full border border-[#9D00FF]/70 animate-sonar pointer-events-none"
              style={{ animationDelay: '0.5s' }}
            />
            <div
              className="absolute -inset-9 rounded-full border border-[#39FF14]/50 animate-sonar pointer-events-none"
              style={{ animationDelay: '1.0s' }}
            />
          </>
        )}

        {/* Central circular badge */}
        <div
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            isScammer
              ? 'bg-[#0A110A] border-2 border-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.4)] group-hover:shadow-[0_0_30px_rgba(57,255,20,0.7)]'
              : isMixer
              ? 'bg-[#0A110A] border-2 border-[#9D00FF] shadow-[0_0_22px_rgba(157,0,255,0.5)] group-hover:shadow-[0_0_32px_rgba(157,0,255,0.8)]'
              : isDex
              ? 'bg-[#0A110A] border-2 border-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.45)] group-hover:shadow-[0_0_30px_rgba(0,255,136,0.75)]'
              : isExchange
              ? 'bg-[#0A110A] border-2 border-[#FF00A8] shadow-[0_0_35px_rgba(157,0,255,0.7),inset_0_0_15px_rgba(57,255,20,0.3)] group-hover:shadow-[0_0_45px_rgba(255,0,168,0.9)] animate-pulse'
              : 'bg-[#0A110A] border-2 border-[#7FFF67] shadow-[0_0_18px_rgba(127,255,103,0.35)] group-hover:shadow-[0_0_26px_rgba(127,255,103,0.6)]'
          } ${selected ? 'ring-2 ring-[#39FF14]' : ''}`}
        >
          {/* Inner subtle glow */}
          <div
            className={`absolute inset-1 rounded-full opacity-25 ${
              isScammer
                ? 'bg-[#39FF14]'
                : isMixer
                ? 'bg-[#9D00FF]'
                : isDex
                ? 'bg-[#00FF88]'
                : isExchange
                ? 'bg-[#9D00FF]'
                : 'bg-[#7FFF67]'
            }`}
          />

          {/* Node Icon */}
          <div className="relative z-10">
            {isScammer && <Skull className="w-7 h-7 text-[#39FF14]" />}
            {isMixer && <AlertTriangle className="w-7 h-7 text-[#9D00FF]" />}
            {isDex && <ArrowLeftRight className="w-7 h-7 text-[#00FF88]" />}
            {isExchange && <Landmark className="w-7 h-7 text-[#FF00A8]" />}
            {isLayer && <Layers className="w-7 h-7 text-[#7FFF67]" />}
          </div>

          {/* Target Tag Badge for Exchange */}
          {isExchange && (
            <div className="absolute -top-3 px-2 py-0.5 bg-gradient-to-r from-[#FF00A8] to-[#9D00FF] text-white text-[9px] font-mono font-bold tracking-wider rounded-full uppercase shadow-[0_0_12px_rgba(255,0,168,0.8)] border border-[#39FF14]/40">
              FREEZE TARGET
            </div>
          )}

          {/* Mixer Badge */}
          {isMixer && (
            <div className="absolute -top-3 px-2 py-0.5 bg-[#9D00FF] text-white text-[8.5px] font-mono font-bold tracking-wider rounded-full uppercase shadow-[0_0_10px_rgba(157,0,255,0.8)] border border-[#9D00FF]">
              TOXIC MIXER
            </div>
          )}

          {/* DEX Badge */}
          {isDex && (
            <div className="absolute -top-3 px-2 py-0.5 bg-[#00FF88]/20 text-[#00FF88] text-[8.5px] font-mono font-bold tracking-wider rounded-full uppercase shadow-[0_0_10px_rgba(0,255,136,0.6)] border border-[#00FF88]">
              DEX POISON
            </div>
          )}
        </div>
      </div>

      {/* Label & Details Container below Node - 220px width */}
      <div className="mt-2.5 flex flex-col items-center text-center w-[220px] max-w-[220px] px-1 pointer-events-none">
        <div className="font-mono text-xs font-semibold text-[#F0FFF0] tracking-tight flex items-center justify-center gap-1 truncate w-full">
          {nodeData.label}
        </div>
        {nodeData.subLabel && (
          <div className="font-mono text-[10px] text-[#8BA88B] mt-0.5 leading-tight truncate w-full">
            {nodeData.subLabel}
          </div>
        )}
        {nodeData.amount && (
          <div
            className={`font-mono text-[11px] font-bold mt-1 px-2.5 py-0.5 rounded border whitespace-nowrap ${
              isExchange
                ? 'text-[#FF00A8] bg-[#FF00A8]/10 border-[#FF00A8]/30 shadow-[0_0_10px_rgba(255,0,168,0.3)]'
                : isMixer
                ? 'text-[#B026FF] bg-[#9D00FF]/15 border-[#9D00FF]/35 shadow-[0_0_10px_rgba(157,0,255,0.3)]'
                : isDex
                ? 'text-[#00FF88] bg-[#00FF88]/10 border-[#00FF88]/30 shadow-[0_0_10px_rgba(0,255,136,0.3)]'
                : isScammer
                ? 'text-[#39FF14] bg-[#39FF14]/10 border-[#39FF14]/30'
                : 'text-[#7FFF67] bg-[#7FFF67]/10 border-[#7FFF67]/30'
            }`}
          >
            {nodeData.amount}
          </div>
        )}
      </div>

      {/* Source output handle (right) */}
      {!isExchange && (
        <Handle
          type="source"
          position={Position.Right}
          className={`!w-2 !h-2 !border-none !-right-1 ${
            isMixer ? '!bg-[#9D00FF]' : isDex ? '!bg-[#00FF88]' : '!bg-[#39FF14]'
          }`}
        />
      )}
    </motion.div>
  );
};
