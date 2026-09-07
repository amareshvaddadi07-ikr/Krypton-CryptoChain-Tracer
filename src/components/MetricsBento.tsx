import React from 'react';
import { motion } from 'motion/react';
import { VaspDetail } from '../types';
import { CountUp } from './CountUp';
import { CircularProgress } from './CircularProgress';
import {
  Landmark,
  Route,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  Layers,
  Fingerprint,
  FileCheck,
} from 'lucide-react';
import { PatternMatchResult } from '../utils/patternMatcher';

interface MetricsBentoProps {
  vasp: VaspDetail;
  chain: string;
  isDeep?: boolean;
  peelingCount?: number;
  patternMatch?: PatternMatchResult;
}

export const MetricsBento: React.FC<MetricsBentoProps> = ({
  vasp,
  chain,
  isDeep = false,
  peelingCount = 0,
  patternMatch,
}) => {
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Card 1: Nearest VASP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="p-4 bg-[#0A110A]/85 border border-[#39FF14]/20 rounded-2xl backdrop-blur-xl group hover:border-[#39FF14]/40 transition-all shadow-[0_4px_20px_rgba(57,255,20,0.06)] flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono text-[#8BA88B] uppercase tracking-tighter mb-1">
              Nearest VASP
            </div>
            <div className="w-6 h-6 rounded-lg bg-[#39FF14]/15 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.2)]">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-1.5">
            <div className="text-2xl font-bold text-white tracking-tight mb-1 font-sans flex items-center gap-2">
              <span>{vasp.name}</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#39FF14]/10 border border-[#39FF14]/25 text-[#39FF14] font-bold uppercase">
                {chain}
              </span>
            </div>
            <div className="text-[10px] font-mono text-[#39FF14] truncate">
              Hot Wallet {vasp.hotWallet}
            </div>
          </div>

          <div className="pt-2 border-t border-[#39FF14]/10 flex items-center justify-between text-[9px] font-mono text-[#8BA88B]">
            <span>SLA: {vasp.sla || '47 min'}</span>
            <span className="text-[#39FF14] font-medium">91 CrPC / 94 BNSS</span>
          </div>
        </motion.div>

        {/* Card 2: Distance / Trace Depth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="p-4 bg-[#0A110A]/85 border border-[#39FF14]/20 rounded-2xl backdrop-blur-xl group hover:border-[#39FF14]/40 transition-all shadow-[0_4px_20px_rgba(57,255,20,0.06)] flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono text-[#8BA88B] uppercase tracking-tighter mb-1">
              {isDeep ? 'Trace Depth' : 'Distance'}
            </div>
            <div
              className={`w-6 h-6 rounded-lg border flex items-center justify-center ${
                isDeep
                  ? 'bg-[#9D00FF]/20 border-[#9D00FF]/40 text-[#B026FF] shadow-[0_0_8px_rgba(157,0,255,0.3)]'
                  : 'bg-[#39FF14]/15 border-[#39FF14]/30 text-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.2)]'
              }`}
            >
              {isDeep ? <Layers className="w-3.5 h-3.5" /> : <Route className="w-3.5 h-3.5" />}
            </div>
          </div>

          <div className="my-1.5">
            <div className="text-2xl font-bold text-white tracking-tight mb-1 font-sans flex items-center gap-2">
              <span>{vasp.hopsText}</span>
              {isDeep && (
                <span className="w-2 h-2 rounded-full bg-[#9D00FF] animate-ping" />
              )}
            </div>
            <div
              className={`flex items-center gap-1.5 text-[10px] font-mono ${
                isDeep ? 'text-[#B026FF]' : 'text-[#39FF14]'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{isDeep ? 'MULTI-LAYER BFS COMPLETED' : 'DIRECT PATH FOUND'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#39FF14]/10 flex items-center justify-between text-[9px] font-mono text-[#8BA88B]">
            <span>{isDeep ? `PEELING: ${peelingCount} DETECTED` : 'TRAIL INTEGRITY: COMPLETE'}</span>
            <span className={isDeep ? 'text-[#D8B4FE] font-semibold' : 'text-[#39FF14]'}>
              {isDeep ? 'MIXER/DEX RESOLVED' : 'NO MIXERS USED'}
            </span>
          </div>
        </motion.div>

        {/* Card 3: Confidence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="p-4 bg-[#0A110A]/85 border border-[#39FF14]/20 rounded-2xl backdrop-blur-xl group hover:border-[#39FF14]/40 transition-all shadow-[0_4px_20px_rgba(57,255,20,0.06)] flex flex-col justify-between relative overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#8BA88B] uppercase tracking-tighter mb-1">
                Confidence
              </div>
              <div className="text-2xl font-bold text-white tracking-tight mb-1 font-sans flex items-baseline gap-1">
                <CountUp end={vasp.confidence} duration={1.2} />
                <span>%</span>
              </div>
              <div className="text-[9px] font-mono text-[#8BA88B] max-w-[210px] truncate" title={vasp.breakdown}>
                {vasp.breakdown}
              </div>
            </div>

            <div className="shrink-0">
              <CircularProgress percentage={vasp.confidence} size={46} strokeWidth={3.5} />
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-[#39FF14]/10 flex items-center justify-between text-[9px] font-mono text-[#8BA88B] mt-2">
            <span>EVIDENTIARY THRESHOLD</span>
            <span className={isDeep ? 'text-[#7FFF67] font-semibold' : 'text-[#39FF14] font-semibold'}>
              {isDeep ? 'HIGH PROBATIVE' : 'HIGH CERTAINTY'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Forensic Pattern Matcher Banner (Sec 63 BSA / Sec 65B IEA) */}
      {patternMatch && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-gradient-to-r from-[#9D00FF]/20 via-[#0A110A] to-[#0A110A] border border-[#9D00FF]/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono backdrop-blur-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#9D00FF]/25 border border-[#9D00FF]/40 flex items-center justify-center text-[#B026FF] shrink-0 shadow-[0_0_10px_rgba(157,0,255,0.3)]">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#D8B4FE] font-bold uppercase">
                  FORENSIC PATTERN MATCH: {patternMatch.pattern.name}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14] text-[10px] font-bold">
                  {patternMatch.score}% MATCH
                </span>
                <span className="text-[10px] text-[#8BA88B] hidden md:inline">
                  ({patternMatch.similarCasesCount} similar NCRP cases)
                </span>
              </div>
              <div className="text-[11px] text-[#F0FFF0]/80 mt-0.5">
                {patternMatch.explanation}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center text-[10px] text-[#8BA88B]">
            <span className="px-2 py-0.5 rounded bg-[#39FF14]/10 border border-[#39FF14]/25 text-[#39FF14]">
              Sec 63 BSA Admissible
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
