import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, CornerDownLeft, Dices, AlertCircle, CheckCircle2 } from 'lucide-react';

const RANDOM_WALLETS = [
  'TYqPw7z2okBhVx1p4mLc8q90dBa1n341bX', // TRON / WazirX
  'TQa9s3q4o1k2f3a4s5d6f7g8h9j0k1l2m3n', // TRON / Binance
  '0x71C83a48e71887e14035f5c9288e1a5f40e089eF', // ETH / Binance
  'TLyqzVGLV1srkBcwBEmZcUUJ1mdh9S1TP8', // TRON Mule
  'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL', // TRON Layer 1
  '0x28C6c06298d514Db089934071355E5743bf21d60', // ETH Hot Wallet
];

export function getRandomWallet() {
  const index = Math.floor(Math.random() * RANDOM_WALLETS.length);
  return RANDOM_WALLETS[index];
}

export function isValidAddress(address) {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  // Valid TRON (starts with T, length ~34) or EVM (starts with 0x, 42 chars) or general crypto address
  if (/^T[1-9A-HJ-NP-za-km-z]{33}$/.test(trimmed)) return true;
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return true;
  return trimmed.length >= 26 && trimmed.length <= 64;
}

export const WalletInput = ({
  walletAddress: controlledWallet,
  setWalletAddress: controlledSetWallet,
  onInvestigate,
  handleInvestigate: propHandleInvestigate,
  isTracing = false,
  firNumber = 'NCRP/2025/8847',
  className = '',
}) => {
  // Local state if not fully controlled
  const [internalWallet, setInternalWallet] = useState('');
  const walletAddress = controlledWallet !== undefined ? controlledWallet : internalWallet;
  const setWalletAddress = controlledSetWallet || setInternalWallet;

  // 4. Add flag to prevent auto nav
  const [isRandomClicked, setIsRandomClicked] = useState(false);
  const [hasEditedWallet, setHasEditedWallet] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [detectedChain, setDetectedChain] = useState('TRON');

  // Investigate handler caller
  const triggerInvestigate = propHandleInvestigate || onInvestigate || (() => {});

  // 2. Validate wallet format ONLY (DO NOT auto-investigate)
  const validateWalletFormat = useCallback((addr) => {
    if (!addr || !addr.trim()) {
      setValidationError(null);
      return false;
    }
    const clean = addr.trim();
    if (clean.startsWith('T') && clean.length === 34) {
      setDetectedChain('TRON');
      setValidationError(null);
      return true;
    } else if (clean.startsWith('0x') && clean.length === 42) {
      setDetectedChain('ETH');
      setValidationError(null);
      return true;
    } else if (clean.length < 26) {
      setValidationError('Wallet address too short');
      return false;
    } else {
      setDetectedChain('CRYPTO');
      setValidationError(null);
      return true;
    }
  }, []);

  // 2. Auto-validation effect: ONLY validates format, NEVER triggers investigation
  useEffect(() => {
    if (walletAddress) {
      validateWalletFormat(walletAddress);
    } else {
      setValidationError(null);
    }
  }, [walletAddress, validateWalletFormat]);

  // 1. Fixed handleRandomWallet: ONLY fills input field, DOES NOT call investigate or navigate
  const handleRandomWallet = useCallback(() => {
    const random = getRandomWallet();
    setWalletAddress(random); // ONLY set input field
    setHasEditedWallet(true);
    setIsRandomClicked(true); // Flag set, but DO NOT navigate or call investigate
    validateWalletFormat(random);
  }, [setWalletAddress, validateWalletFormat]);

  // 3. Investigate button must be the ONLY trigger with rigorous guards
  const handleInvestigateClick = useCallback(
    (addrToInvestigate) => {
      const target = addrToInvestigate || walletAddress;
      if (!target || !isValidAddress(target)) {
        setValidationError('Please enter a valid TRON (T...) or EVM (0x...) wallet address');
        return;
      }
      setValidationError(null);
      setIsRandomClicked(false);
      triggerInvestigate(target);
    },
    [walletAddress, triggerInvestigate]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInvestigateClick(walletAddress);
    }
  };

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      {/* Search Bar Container */}
      <div className="relative rounded-xl transition-all bg-[#0A110A]/90 border border-[#39FF14]/20 focus-within:border-[#39FF14] focus-within:shadow-[0_0_20px_rgba(57,255,20,0.3)] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(57,255,20,0.05)] hover:border-[#39FF14]/40 px-4 py-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Search Icon */}
          <div className="text-[#39FF14]/60 pl-0.5 shrink-0">
            <Search className="w-5 h-5" />
          </div>

          {/* Input field */}
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => {
              setWalletAddress(e.target.value);
              setHasEditedWallet(true);
              setIsRandomClicked(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder="TYq9w... or paste any suspect wallet (TRON, ETH, BSC)"
            disabled={isTracing}
            className="flex-1 bg-transparent text-[#39FF14] font-mono placeholder:text-white/30 focus:outline-none tracking-tight font-medium text-xs sm:text-sm"
          />

          {/* Right side chain tag, Random button & Action button */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#39FF14]/10 border border-[#39FF14]/20 rounded text-[9px] font-bold text-[#39FF14] font-mono uppercase tracking-wider">
              {detectedChain}
            </span>

            {/* Random Wallet Quick Fill Button */}
            <button
              type="button"
              onClick={handleRandomWallet}
              title="Fill with a random sample wallet without investigating"
              className="px-2.5 py-1.5 rounded-lg border border-[#9D00FF]/40 bg-[#9D00FF]/15 hover:bg-[#9D00FF]/30 text-[#D8B4FE] hover:text-white font-mono text-[10px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5 text-[#B026FF]" />
              <span className="hidden sm:inline">Random</span>
            </button>

            {/* Investigate Action Button (THE ONLY TRIGGER) */}
            {isTracing ? (
              <span className="px-3 py-1.5 bg-[#39FF14] rounded-lg text-xs font-bold text-[#050805] font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(57,255,20,0.5)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#050805]" />
                <span>TRACING...</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleInvestigateClick(walletAddress)}
                className="group flex items-center gap-1.5 bg-gradient-to-r from-[#39FF14] to-[#00FF88] text-[#050805] px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(57,255,20,0.5)] hover:shadow-[0_0_25px_rgba(57,255,20,0.7)] active:scale-95"
              >
                <span>INVESTIGATE</span>
                <CornerDownLeft className="w-3.5 h-3.5 opacity-80 hidden sm:inline-block transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Validation error or Random filled notification */}
      {validationError && (
        <div className="mt-2 px-2 flex items-center gap-1.5 text-xs text-rose-400 font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {isRandomClicked && !validationError && (
        <div className="mt-2 px-2 flex items-center gap-1.5 text-[10px] text-[#B026FF] font-mono">
          <CheckCircle2 className="w-3 h-3 text-[#B026FF]" />
          <span>Random wallet populated in input field. Click &quot;INVESTIGATE&quot; or press [Enter] to trace.</span>
        </div>
      )}

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
    </div>
  );
};

export default WalletInput;
