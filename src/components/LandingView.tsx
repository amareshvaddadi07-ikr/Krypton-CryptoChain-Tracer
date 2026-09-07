import React from 'react';
import { motion } from 'motion/react';
import { CaseData } from '../types';
import { Hero } from './Hero';
import { CountUp } from './CountUp';
import { Dices } from 'lucide-react';

interface LandingViewProps {
  walletInput: string;
  setWalletInput: (val: string) => void;
  currentCase: CaseData;
  presets?: CaseData[];
  onSelectPreset?: (preset: CaseData, immediateInvestigate?: boolean) => void;
  isTracing: boolean;
  onInvestigate: (walletOverride?: string, firData?: any) => void;
  onRandomWallet: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  walletInput,
  setWalletInput,
  currentCase,
  isTracing,
  onInvestigate,
  onRandomWallet,
}) => {
  const [isRandomClicked, setIsRandomClicked] = React.useState(false);

  const handleRandomClick = () => {
    setIsRandomClicked(true);
    onRandomWallet(); // ONLY sets input field, DOES NOT navigate or auto-investigate
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between items-center py-12 sm:py-20 md:py-24 px-4 max-w-5xl mx-auto z-10">
      {/* Hero Center Section with Generous Breathing Room */}
      <div className="w-full my-auto flex flex-col items-center text-center">
        {/* Sora Bold Tight Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-1 sm:space-y-2 mb-3 sm:mb-4"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.04em] text-white leading-[1.05]">
            Trace the untraceable.
          </h1>
          <div className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.04em] flex items-center justify-center gap-1 leading-[1.05]">
            <span className="bg-gradient-to-r from-[#39FF14] via-[#7FFF67] to-[#00FF88] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(57,255,20,0.45)]">
              Freeze the unfreezable.
            </span>
            <span className="inline-block w-[3px] sm:w-[4px] h-[0.9em] bg-[#39FF14] ml-1 shadow-[0_0_12px_#39FF14] animate-cursor-blink align-middle" />
          </div>
        </motion.div>

        {/* Minimal Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="font-mono text-[#8BA88B] text-xs sm:text-sm md:text-base max-w-xl mx-auto mb-8 sm:mb-10 tracking-tight"
        >
          Paste suspect wallet. Find nearest VASP in 0.8s.
        </motion.p>

        {/* Glassmorphic FIR Investigation Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full"
        >
          <Hero
            initialWallet={walletInput}
            onInvestigate={(wallet: string, firData?: any) => {
              setWalletInput(wallet);
              onInvestigate(wallet, firData);
            }}
            onNavigate={(path: string, firData?: any) => {
              const targetWallet = firData?.walletAddress || walletInput;
              setWalletInput(targetWallet);
              onInvestigate(targetWallet, firData);
            }}
          />
        </motion.div>

        {/* Minimal Random Wallet Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 flex flex-col items-center justify-center gap-2"
        >
          <button
            type="button"
            onClick={handleRandomClick}
            className="group px-5 py-2.5 rounded-full font-mono text-xs transition-all duration-200 flex items-center gap-2.5 cursor-pointer border backdrop-blur-xl bg-[#9D00FF]/15 hover:bg-[#9D00FF]/30 border-[#9D00FF]/40 hover:border-[#B026FF] text-[#D8B4FE] hover:text-white shadow-[0_0_20px_rgba(157,0,255,0.2)] active:scale-95"
          >
            <Dices className="w-4 h-4 text-[#B026FF] group-hover:rotate-180 transition-transform duration-500" />
            <span className="font-semibold tracking-wide">🎲 Random Wallet</span>
          </button>

          {isRandomClicked && (
            <p className="text-[11px] font-mono text-[#D8B4FE]/80 tracking-tight animate-fade-in">
              Random wallet populated. Click <strong className="text-[#39FF14]">INVESTIGATE</strong> to trace.
            </p>
          )}
        </motion.div>
      </div>

      {/* Bottom Stats & Attribution - Frosted Glass Footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="w-full pt-8 border-t border-[#39FF14]/15 flex flex-col items-center gap-4 mt-12"
      >
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[9px] font-mono text-[#8BA88B] uppercase">Cases Today</span>
            <span className="text-sm sm:text-base font-bold text-[#39FF14] font-mono shadow-[0_0_10px_rgba(57,255,20,0.3)]">
              <CountUp end={47} duration={1.5} />
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[9px] font-mono text-[#8BA88B] uppercase">Traced</span>
            <span className="text-sm sm:text-base font-bold text-[#00FF88] font-mono">
              ₹2.3Cr
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[9px] font-mono text-[#8BA88B] uppercase">Latency</span>
            <span className="text-sm sm:text-base font-bold text-white font-mono">
              0.8s
            </span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-[#8BA88B] tracking-wider uppercase text-center">
          KRYPTON // Built for Bharat // Cost Rs 0 vs Chainalysis Rs 2.5Cr // Green is trace, Purple is poison, Black is chain
        </div>
      </motion.div>
    </div>
  );
};
