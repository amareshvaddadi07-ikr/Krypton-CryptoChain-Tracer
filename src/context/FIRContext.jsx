import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useInvestigation } from './InvestigationContext';

export const FIRContext = createContext(null);

export const FIRProvider = ({
  children,
  initialFirNumber = '',
  initialWalletAddress = '',
  initialPoliceStation = '',
  initialFirDate = '',
}) => {
  // Try to load initial defaults from localStorage
  const getInitialValue = (key, fallback) => {
    try {
      if (typeof window === 'undefined') return fallback;
      const savedFir = localStorage.getItem('krypton_fir');
      if (savedFir) {
        const parsed = JSON.parse(savedFir);
        if (key === 'walletAddress' && parsed.walletAddress) return parsed.walletAddress;
        if (key === 'firNumber' && parsed.firNumber) return parsed.firNumber;
        if (key === 'policeStation' && parsed.policeStation) return parsed.policeStation;
        if (key === 'firDate' && parsed.firDate) return parsed.firDate;
      }
      if (key === 'walletAddress') {
        const savedWallet = localStorage.getItem('krypton_wallet');
        if (savedWallet) return savedWallet;
      }
    } catch (e) {
      // Ignore
    }
    return fallback;
  };

  // Context state: {firNumber, walletAddress, policeStation, firDate}
  const [firNumber, setFirNumber] = useState(() =>
    initialFirNumber || getInitialValue('firNumber', '123/2024')
  );
  const [walletAddress, setWalletAddressState] = useState(() =>
    initialWalletAddress || getInitialValue('walletAddress', '')
  );
  const [policeStation, setPoliceStation] = useState(() =>
    initialPoliceStation || getInitialValue('policeStation', 'Cyber Police Station, Delhi')
  );
  const [firDate, setFirDate] = useState(() =>
    initialFirDate || getInitialValue('firDate', new Date().toISOString().split('T')[0])
  );

  // Investigation context integration for statutory state machine
  const investigationContext = useInvestigation();
  const resetEscalationLadder = investigationContext?.resetEscalationLadder || (async () => {});

  const prevWalletRef = useRef(walletAddress);

  /**
   * Function getInvestigationMeta() returns all 4 fields + combined caseId = `KRYPTON-${firNumber}-${walletAddress.slice(0,6)}`
   */
  const getInvestigationMeta = useCallback((overrides = {}) => {
    const fn = overrides.firNumber !== undefined ? overrides.firNumber : firNumber;
    const wa = overrides.walletAddress !== undefined ? overrides.walletAddress : walletAddress;
    const ps = overrides.policeStation !== undefined ? overrides.policeStation : policeStation;
    const fd = overrides.firDate !== undefined ? overrides.firDate : firDate;
    const shortWallet = wa ? String(wa).slice(0, 6) : '';
    const combinedCaseId = `KRYPTON-${fn || 'NO_FIR'}-${shortWallet}`;

    return {
      firNumber: fn,
      walletAddress: wa,
      policeStation: ps,
      firDate: fd,
      caseId: combinedCaseId,
      combinedCaseId,
    };
  }, [firNumber, walletAddress, policeStation, firDate]);

  /**
   * Trigger statutory reset whenever walletAddress changes
   */
  const setWalletAddress = useCallback((newWallet) => {
    setWalletAddressState((prev) => {
      const next = typeof newWallet === 'function' ? newWallet(prev) : newWallet;
      if (next !== prev) {
        try {
          if (typeof resetEscalationLadder === 'function') {
            resetEscalationLadder();
          }
          if (typeof window !== 'undefined') {
            localStorage.removeItem('escalation_current_stage');
            localStorage.removeItem('escalation_next_at');
            window.dispatchEvent(new CustomEvent('krypton:reset-ladder', { detail: { newWallet: next } }));
          }
        } catch (err) {
          console.warn('[FIRContext] resetEscalationLadder error:', err);
        }
      }
      return next;
    });
  }, [resetEscalationLadder]);

  // Reset escalation ladder whenever walletAddress transitions
  useEffect(() => {
    if (prevWalletRef.current !== walletAddress) {
      prevWalletRef.current = walletAddress;
      if (typeof resetEscalationLadder === 'function') {
        resetEscalationLadder();
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('escalation_current_stage');
        localStorage.removeItem('escalation_next_at');
        window.dispatchEvent(new CustomEvent('krypton:reset-ladder', { detail: { newWallet: walletAddress } }));
      }
    }
  }, [walletAddress, resetEscalationLadder]);

  // Bulk update helper
  const setFirData = useCallback((data) => {
    if (!data || typeof data !== 'object') return;
    if (data.firNumber !== undefined) setFirNumber(data.firNumber);
    if (data.policeStation !== undefined) setPoliceStation(data.policeStation);
    if (data.firDate !== undefined) setFirDate(data.firDate);
    if (data.walletAddress !== undefined) setWalletAddress(data.walletAddress);

    try {
      if (typeof window !== 'undefined') {
        const payload = {
          firNumber: data.firNumber ?? firNumber,
          walletAddress: data.walletAddress ?? walletAddress,
          policeStation: data.policeStation ?? policeStation,
          firDate: data.firDate ?? firDate,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('krypton_fir', JSON.stringify(payload));
        if (data.walletAddress) {
          localStorage.setItem('krypton_wallet', data.walletAddress);
        }
      }
    } catch (e) {
      // Ignore
    }
  }, [firNumber, walletAddress, policeStation, firDate, setWalletAddress]);

  const value = {
    // Context state: {firNumber, walletAddress, policeStation, firDate}
    firNumber,
    walletAddress,
    policeStation,
    firDate,
    // Setters
    setFirNumber,
    setWalletAddress,
    setPoliceStation,
    setFirDate,
    setFirData,
    // Function getInvestigationMeta()
    getInvestigationMeta,
    // Reset statutory ladder
    resetEscalationLadder,
  };

  return <FIRContext.Provider value={value}>{children}</FIRContext.Provider>;
};

export const useFIR = () => {
  const context = useContext(FIRContext);
  if (!context) {
    // Graceful fallback outside provider
    let fn = '123/2024';
    let wa = '';
    let ps = 'Cyber Police Station, Delhi';
    let fd = new Date().toISOString().split('T')[0];

    try {
      if (typeof window !== 'undefined') {
        const savedFir = localStorage.getItem('krypton_fir');
        if (savedFir) {
          const parsed = JSON.parse(savedFir);
          if (parsed.firNumber) fn = parsed.firNumber;
          if (parsed.walletAddress) wa = parsed.walletAddress;
          if (parsed.policeStation) ps = parsed.policeStation;
          if (parsed.firDate) fd = parsed.firDate;
        }
        const savedWallet = localStorage.getItem('krypton_wallet');
        if (savedWallet && !wa) wa = savedWallet;
      }
    } catch (e) {}

    const shortWallet = wa ? wa.slice(0, 6) : '';
    const combinedCaseId = `KRYPTON-${fn}-${shortWallet}`;

    return {
      firNumber: fn,
      walletAddress: wa,
      policeStation: ps,
      firDate: fd,
      setFirNumber: () => {},
      setWalletAddress: () => {},
      setPoliceStation: () => {},
      setFirDate: () => {},
      setFirData: () => {},
      resetEscalationLadder: async () => {},
      getInvestigationMeta: (overrides = {}) => {
        const f = overrides.firNumber !== undefined ? overrides.firNumber : fn;
        const w = overrides.walletAddress !== undefined ? overrides.walletAddress : wa;
        const p = overrides.policeStation !== undefined ? overrides.policeStation : ps;
        const d = overrides.firDate !== undefined ? overrides.firDate : fd;
        const sw = w ? String(w).slice(0, 6) : '';
        const cid = `KRYPTON-${f || 'NO_FIR'}-${sw}`;
        return {
          firNumber: f,
          walletAddress: w,
          policeStation: p,
          firDate: d,
          caseId: cid,
          combinedCaseId: cid,
        };
      },
    };
  }
  return context;
};

export default FIRContext;
