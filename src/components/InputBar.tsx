import React from 'react';
import { motion } from 'motion/react';
import { Search, Loader2, CornerDownLeft } from 'lucide-react';

interface InputBarProps {
  walletInput: string;
  setWalletInput: (val: string) => void;
  chain: string;
  firNumber: string;
  isTracing: boolean;
  onInvestigate: () => void;
  isCompact?: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({
  walletInput,
  setWalletInput,
  chain,
  firNumber,
  isTracing,
  onInvestigate,
  isCompact = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onInvestigate();
    }
  };

  return (
    <motion.div
      layoutId="main-input-bar"
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className={`w-full ${isCompact ? 'max-w-5xl mx-auto' : 'max-w-3xl mx-auto'}`}
    >
      {/* Frosted Glass bar */}
      <div
        className={`relative rounded-xl transition-all bg-[#0A110A]/90 border border-[#39FF14]/20 focus-within:border-[#39FF14] focus-within:shadow-[0_0_20px_rgba(57,255,20,0.3)] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(57,255,20,0.05)] hover:border-[#39FF14]/40 ${
          isCompact ? 'px-3 py-2' : 'px-4 py-3'
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Search Icon */}
          <div className="text-[#39FF14]/60 pl-0.5 shrink-0">
            <Search className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>

          {/* Input field */}
          <input
            type="text"
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="TYq9w... or paste any suspect wallet (TRON, ETH, BSC)"
            disabled={isTracing}
            className={`flex-1 bg-transparent text-[#39FF14] font-mono placeholder:text-white/30 focus:outline-none tracking-tight font-medium ${
              isCompact ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm'
            }`}
          />

          {/* Right side chain tag & Action button */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#39FF14]/10 border border-[#39FF14]/20 rounded text-[9px] font-bold text-[#39FF14] font-mono uppercase tracking-wider">
              {chain}
            </span>

            {/* Action button / Status pill */}
            {isTracing ? (
              <span className="px-2.5 py-0.5 bg-[#39FF14] rounded text-[9px] font-bold text-[#050805] font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(57,255,20,0.5)]">
                <Loader2 className="w-3 h-3 animate-spin text-[#050805]" />
                <span>TRACING...</span>
              </span>
            ) : (
              <button
                onClick={onInvestigate}
                className="group flex items-center gap-1.5 bg-gradient-to-r from-[#39FF14] to-[#00FF88] text-[#050805] px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(57,255,20,0.5)] hover:shadow-[0_0_25px_rgba(57,255,20,0.7)] active:scale-95"
              >
                <span>INVESTIGATE</span>
                <CornerDownLeft className="w-3.5 h-3.5 opacity-80 hidden sm:inline-block transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Helper text below input */}
      <div className="mt-2 px-2 flex items-center justify-between font-mono text-[9px] text-white/30 tracking-wider uppercase">
        <div className="flex items-center gap-1.5">
          <span>PRESS</span>
          <span className="text-white/50 font-semibold">[CMD+I]</span>
          <span>OR</span>
          <span className="text-white/50 font-semibold">[ENTER]</span>
          <span>TO TRACE</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span>FIR NO:</span>
          <span className="text-white/60 font-semibold">{firNumber}</span>
        </div>
      </div>
    </motion.div>
  );
};
