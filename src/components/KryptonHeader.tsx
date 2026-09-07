import React from 'react';
import { KryptonLogo } from './KryptonLogo';

interface KryptonHeaderProps {
  firNumber?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const KryptonHeader: React.FC<KryptonHeaderProps> = ({
  showBack = false,
  onBack,
}) => {
  return (
    <header
      id="krypton-official-header"
      className="w-full bg-[#050805] border-b border-[#39FF14]/20 px-4 sm:px-6 lg:px-8 py-3 relative z-30 transition-all backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Side: 56px x 56px Official Logo + Wordmark */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          {showBack && onBack && (
            <button
              onClick={onBack}
              title="Return to Search"
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-mono text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 mr-1"
            >
              ← <span className="hidden sm:inline">Search</span>
            </button>
          )}

          {/* 56px x 56px Logo with Kryptonite Glow Effect */}
          <div className="shrink-0 flex items-center justify-center">
            <KryptonLogo size={56} glow={true} />
          </div>

          {/* Wordmark (Line 1 & Line 2) */}
          <div className="flex flex-col justify-center select-none">
            {/* Line 1: KRYPTON in bold white, tracking wide, with PT in neon green #39FF14 */}
            <div className="flex items-baseline font-sora font-extrabold tracking-[0.18em] text-lg sm:text-2xl leading-none">
              <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">KRY</span>
              <span className="text-[#39FF14] drop-shadow-[0_0_14px_#39FF14] mx-[0.5px]">PT</span>
              <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">ON</span>
            </div>

            {/* Line 2: NATIONAL VASP DETECTOR • I4C MHA in small uppercase 11px, purple #9D00FF, letter spacing 0.25em */}
            <div className="mt-1 font-mono text-[10px] sm:text-[11px] font-bold text-[#9D00FF] uppercase tracking-[0.25em] leading-tight flex items-center gap-1.5">
              <span>NATIONAL VASP DETECTOR</span>
              <span className="text-[#9D00FF]/60">•</span>
              <span className="text-[#B026FF]">I4C MHA</span>
            </div>
          </div>
        </div>

        {/* Right Side: Empty or user profile (no mockup button) */}
        <div className="flex items-center" />
      </div>
    </header>
  );
};
