import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Link2,
  Building2,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useFIR } from '../context/FIRContext';
import { useInvestigation } from '../context/InvestigationContext';

export const FIR_REGEX = /^[0-9]+\/[0-9]{4}$/;

/**
 * Validates whether an address is a valid ETH (0x) or TRON (T...) address
 */
export function isValidAddress(address) {
  if (!address || typeof address !== 'string') return false;
  const clean = address.trim();
  // Valid TRON (starts with T, Base58, length 34)
  if (/^T[1-9A-HJ-NP-za-km-z]{33}$/.test(clean)) return true;
  // Valid ETH/EVM (starts with 0x, hex, 42 chars total)
  if (/^0x[a-fA-F0-9]{40}$/i.test(clean)) return true;
  // Lenient fallback for 0x (42 chars) or T (34 chars)
  if (clean.startsWith('0x') && clean.length === 42) return true;
  if (clean.startsWith('T') && clean.length === 34) return true;
  return false;
}

export const Hero = ({
  onNavigate,
  onInvestigate,
  initialWallet = '',
  initialFir = '',
  initialStation = '',
  initialDate = '',
}) => {
  // Integrate with FIRContext & InvestigationContext
  const {
    firNumber: ctxFirNumber,
    walletAddress: ctxWalletAddress,
    policeStation: ctxPoliceStation,
    firDate: ctxFirDate,
    setFirNumber: setCtxFirNumber,
    setWalletAddress: setCtxWalletAddress,
    setPoliceStation: setCtxPoliceStation,
    setFirDate: setCtxFirDate,
    setFirData: setCtxFirData,
    getInvestigationMeta,
  } = useFIR();

  const { resetEscalationLadder } = useInvestigation();

  const [firNumber, setFirNumber] = useState(initialFir || ctxFirNumber || '123/2024');
  const [walletAddress, setWalletAddress] = useState(initialWallet || ctxWalletAddress || '');
  const [policeStation, setPoliceStation] = useState(initialStation || ctxPoliceStation || 'Cyber Police Station, Delhi');
  const [firDate, setFirDate] = useState(initialDate || ctxFirDate || '');

  // Validation & Error states
  const [errors, setErrors] = useState({
    firNumber: false,
    walletAddress: false,
    policeStation: false,
    firDate: false,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const shakeTimeoutRef = useRef(null);
  const prevWalletRef = useRef(walletAddress);

  // Load existing values from localStorage if available
  useEffect(() => {
    try {
      const savedFir = localStorage.getItem('krypton_fir');
      const savedWallet = localStorage.getItem('krypton_wallet');

      if (savedFir) {
        const parsed = JSON.parse(savedFir);
        if (parsed.firNumber && !firNumber) setFirNumber(parsed.firNumber);
        if (parsed.policeStation && !policeStation) setPoliceStation(parsed.policeStation);
        if (parsed.firDate && !firDate) setFirDate(parsed.firDate);
        if (parsed.walletAddress && !walletAddress) setWalletAddress(parsed.walletAddress);
      } else if (savedWallet && !walletAddress) {
        setWalletAddress(savedWallet);
      }
    } catch (e) {
      // Ignore parse error
    }
  }, []);

  // Handler to safely reset the statutory state machine on wallet change
  const triggerStatutoryReset = (targetWallet) => {
    try {
      if (typeof resetEscalationLadder === 'function') {
        resetEscalationLadder();
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('escalation_current_stage');
        localStorage.removeItem('escalation_next_at');
        if (targetWallet) {
          localStorage.setItem('escalation_target_wallet', targetWallet);
        }
        window.dispatchEvent(
          new CustomEvent('krypton:reset-ladder', { detail: { newWallet: targetWallet } })
        );
      }
    } catch (err) {
      console.warn('[Hero] Error triggering statutory reset:', err);
    }
  };

  // Dedicated wallet address change handler for input
  const handleWalletChange = (newVal) => {
    setWalletAddress(newVal);
    if (typeof setCtxWalletAddress === 'function') {
      setCtxWalletAddress(newVal);
    }
    // Explicitly reset statutory state machine
    triggerStatutoryReset(newVal);

    if (errors.walletAddress) {
      setErrors((prev) => ({ ...prev, walletAddress: false }));
    }
  };

  // Reset statutory state machine whenever walletAddress value changes
  useEffect(() => {
    if (prevWalletRef.current !== null && prevWalletRef.current !== walletAddress) {
      prevWalletRef.current = walletAddress;
      triggerStatutoryReset(walletAddress);
    } else if (prevWalletRef.current === null) {
      prevWalletRef.current = walletAddress;
    }
  }, [walletAddress]);

  // Update walletAddress if initialWallet prop updates and reset ladder
  useEffect(() => {
    if (initialWallet && initialWallet !== walletAddress) {
      setWalletAddress(initialWallet);
      if (typeof setCtxWalletAddress === 'function') {
        setCtxWalletAddress(initialWallet);
      }
      triggerStatutoryReset(initialWallet);
      setErrors((prev) => ({ ...prev, walletAddress: false }));
    }
  }, [initialWallet]);

  const triggerShake = () => {
    setIsShaking(false);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    // Trigger reflow to restart CSS animation
    requestAnimationFrame(() => {
      setIsShaking(true);
      shakeTimeoutRef.current = setTimeout(() => {
        setIsShaking(false);
      }, 500);
    });
  };

  const handleLinkAndTrace = (e) => {
    if (e) e.preventDefault();
    setIsSubmitted(true);

    const cleanFir = firNumber.trim();
    const cleanWallet = walletAddress.trim();
    const cleanStation = policeStation.trim();
    const cleanDate = firDate.trim();

    const newErrors = {
      firNumber: false,
      walletAddress: false,
      policeStation: false,
      firDate: false,
    };

    let hasError = false;
    const errorMessages = [];

    // 1. FIR Validation: required and matches regex /^[0-9]+\/[0-9]{4}$/
    if (!cleanFir) {
      newErrors.firNumber = true;
      hasError = true;
      errorMessages.push('FIR Number is required (e.g. 123/2024)');
    } else if (!FIR_REGEX.test(cleanFir)) {
      newErrors.firNumber = true;
      hasError = true;
      errorMessages.push('FIR format must be numbers/year (e.g. 123/2024)');
    }

    // 2. Wallet Validation: required and isValidAddress() check for ETH (0x) or TRON (T...)
    if (!cleanWallet) {
      newErrors.walletAddress = true;
      hasError = true;
      errorMessages.push('Wallet Address is required');
    } else if (!isValidAddress(cleanWallet)) {
      newErrors.walletAddress = true;
      hasError = true;
      errorMessages.push('Invalid wallet: Must be valid ETH (0x...) or TRON (T...) address');
    }

    // 3. Police Station: required
    if (!cleanStation) {
      newErrors.policeStation = true;
      hasError = true;
      errorMessages.push('Police Station is required');
    }

    // 4. FIR Date: required
    if (!cleanDate) {
      newErrors.firDate = true;
      hasError = true;
      errorMessages.push('Date of FIR is required');
    }

    setErrors(newErrors);

    if (hasError) {
      setErrorMessage(errorMessages[0] || 'Please fill in all required fields correctly.');
      triggerShake();
      return;
    }

    setErrorMessage('');

    // Save to localStorage: 'krypton_fir' and 'krypton_wallet'
    const payload = {
      firNumber: cleanFir,
      walletAddress: cleanWallet,
      policeStation: cleanStation,
      firDate: cleanDate,
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem('krypton_fir', JSON.stringify(payload));
      localStorage.setItem('krypton_wallet', cleanWallet);
    } catch (err) {
      console.error('Failed to write to localStorage:', err);
    }

    // Call getInvestigationMeta and setFirData from context
    const meta = getInvestigationMeta ? getInvestigationMeta(payload) : null;
    if (typeof setCtxFirData === 'function') {
      setCtxFirData(payload);
    }

    // Broadcast navigation event for any active listeners
    window.dispatchEvent(
      new CustomEvent('krypton:navigate', {
        detail: { path: '/investigate', fir: payload, wallet: cleanWallet, meta },
      })
    );

    // Call navigation props or fallback to URL routing
    if (typeof onNavigate === 'function') {
      onNavigate('/investigate', payload);
    } else if (typeof onInvestigate === 'function') {
      onInvestigate(cleanWallet, payload);
    } else {
      window.history.pushState({}, '', '/investigate');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Prepopulate sample test data helper
  const handleQuickDemo = () => {
    const demoWallet = 'TYqPw7z2okBhVx1p4mLc8q90dBa1n341bX';
    setFirNumber('123/2024');
    setWalletAddress(demoWallet);
    setPoliceStation('Cyber Police Station, Delhi');
    const today = new Date().toISOString().split('T')[0];
    setFirDate(today);

    setCtxFirNumber?.('123/2024');
    setCtxWalletAddress?.(demoWallet);
    setCtxPoliceStation?.('Cyber Police Station, Delhi');
    setCtxFirDate?.(today);

    // Explicitly reset statutory state machine for demo wallet
    triggerStatutoryReset(demoWallet);

    setErrors({
      firNumber: false,
      walletAddress: false,
      policeStation: false,
      firDate: false,
    });
    setErrorMessage('');
  };

  return (
    <div className="w-full flex flex-col items-center justify-center text-left">
      {/* Glassmorphic Card Container */}
      <div
        id="hero-fir-card"
        className={`w-full max-w-5xl rounded-3xl p-6 sm:p-8 lg:p-10 backdrop-blur-2xl bg-black/75 border transition-all duration-300 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] ${
          isShaking ? 'animate-shake' : ''
        } ${
          errorMessage
            ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
            : 'border-[#39FF14]/25 shadow-[0_0_40px_rgba(57,255,20,0.08)]'
        }`}
      >
        {/* Subtle Ambient Background Gradients inside card */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#39FF14]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#9D00FF]/10 blur-3xl pointer-events-none" />

        {/* Header Title with Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#39FF14]/15 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.25)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-sora">
                Start Investigation with FIR Number
              </h2>
              <p className="text-xs font-mono text-[#8BA88B] mt-0.5">
                Statutory Cross-Chain Intelligence & Legal Freeze Protocol
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickDemo}
            className="self-start sm:self-auto text-[11px] font-mono px-3 py-1.5 rounded-full bg-white/5 hover:bg-[#39FF14]/10 border border-white/10 hover:border-[#39FF14]/40 text-gray-300 hover:text-[#39FF14] transition-all cursor-pointer"
          >
            Auto-fill Sample FIR
          </button>
        </div>

        {/* 2x2 Grid + Right Side Button */}
        <form onSubmit={handleLinkAndTrace} className="relative z-10">
          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            {/* 2x2 Grid on Left / Center */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 flex-1">
              {/* Row 1 Left: FIR Number */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="firNumber"
                  className="text-xs font-mono uppercase tracking-wider text-gray-300 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#39FF14]" />
                    FIR Number <span className="text-[#39FF14]">*</span>
                  </span>
                  <span className="text-[10px] text-gray-500 lowercase">format: 123/2024</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="firNumber"
                    name="firNumber"
                    value={firNumber}
                    onChange={(e) => {
                      setFirNumber(e.target.value);
                      if (errors.firNumber) setErrors((prev) => ({ ...prev, firNumber: false }));
                    }}
                    placeholder="123/2024"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 font-mono text-sm sm:text-base text-white placeholder-gray-500 border transition-all duration-200 outline-none ${
                      errors.firNumber
                        ? 'border-red-500 ring-1 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-shake'
                        : 'border-white/15 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]/50'
                    }`}
                  />
                </div>
              </div>

              {/* Row 1 Right: Wallet Address (highlighted with green glow as primary) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="walletAddress"
                  className="text-xs font-mono uppercase tracking-wider text-[#39FF14] flex items-center justify-between font-semibold"
                >
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-[#39FF14]" />
                    Wallet Address <span className="text-[#39FF14]">*</span>
                  </span>
                  <span className="text-[10px] text-[#39FF14]/70 lowercase">ETH (0x) or TRON (T...)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#39FF14]">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="walletAddress"
                    name="walletAddress"
                    value={walletAddress}
                    onChange={(e) => handleWalletChange(e.target.value)}
                    placeholder="0x1aF...7B3e"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#061206]/85 font-mono text-sm sm:text-base text-white placeholder-gray-500 border transition-all duration-200 outline-none ${
                      errors.walletAddress
                        ? 'border-red-500 ring-1 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-shake'
                        : 'border-[#39FF14] ring-1 ring-[#39FF14]/60 shadow-[0_0_20px_rgba(57,255,20,0.35)] focus:ring-2 focus:ring-[#39FF14] focus:shadow-[0_0_30px_rgba(57,255,20,0.55)]'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2 Left: Police Station */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="policeStation"
                  className="text-xs font-mono uppercase tracking-wider text-gray-300 flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#39FF14]" />
                  Police Station <span className="text-[#39FF14]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="policeStation"
                    name="policeStation"
                    value={policeStation}
                    onChange={(e) => {
                      setPoliceStation(e.target.value);
                      if (errors.policeStation)
                        setErrors((prev) => ({ ...prev, policeStation: false }));
                    }}
                    placeholder="Cyber Police Station, Delhi"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 font-mono text-sm sm:text-base text-white placeholder-gray-500 border transition-all duration-200 outline-none ${
                      errors.policeStation
                        ? 'border-red-500 ring-1 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-shake'
                        : 'border-white/15 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]/50'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2 Right: Date of FIR */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="firDate"
                  className="text-xs font-mono uppercase tracking-wider text-gray-300 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#39FF14]" />
                  Date of FIR <span className="text-[#39FF14]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    id="firDate"
                    name="firDate"
                    value={firDate}
                    onChange={(e) => {
                      setFirDate(e.target.value);
                      if (errors.firDate) setErrors((prev) => ({ ...prev, firDate: false }));
                    }}
                    placeholder="DD/MM/YYYY"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 font-mono text-sm sm:text-base text-white placeholder-gray-500 border transition-all duration-200 outline-none [color-scheme:dark] ${
                      errors.firDate
                        ? 'border-red-500 ring-1 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-shake'
                        : 'border-white/15 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]/50'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Right Side: Green Button "Link FIR & Trace ->" */}
            <div className="flex flex-col justify-end lg:w-56 shrink-0 pt-2 lg:pt-0">
              <button
                type="submit"
                id="btn-link-trace"
                className="w-full h-full min-h-[52px] sm:min-h-[58px] lg:min-h-[110px] rounded-2xl bg-[#39FF14] hover:bg-[#32e012] active:scale-[0.98] text-black font-extrabold text-base sm:text-lg font-sora flex flex-row lg:flex-col items-center justify-center gap-2 lg:gap-3 px-6 py-4 shadow-[0_0_30px_rgba(57,255,20,0.45)] hover:shadow-[0_0_45px_rgba(57,255,20,0.7)] transition-all cursor-pointer border border-[#39FF14]"
              >
                <span className="tracking-tight text-center">Link FIR & Trace -&gt;</span>
                <div className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-black" />
                </div>
              </button>
            </div>
          </div>

          {/* Validation Error Banner */}
          {errorMessage && (
            <div
              id="hero-fir-error"
              className="mt-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs sm:text-sm font-mono flex items-center gap-2.5 animate-shake shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Security & Regulatory Compliance Footer Line */}
          <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
              <span>Admissible u/s 63 Bharatiya Sakshya Adhiniyam (BSA)</span>
            </div>
            <div className="text-gray-500">
              Automated Preservations u/s 91 CrPC & 94 BNSS
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Hero;
