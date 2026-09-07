import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export const InvestigationContext = createContext(null);

export const InvestigationProvider = ({
  children,
  initialWalletAddress = 'TLa2w8q6e4r2t1y7u8i9o0p1a2s3d4f8c9',
  initialCaseId = 'CASE_8847',
  firNumber = 'NCRP/2025/8847',
  vaspName = 'WazirX',
  vaspEmail = 'compliance@wazirx.com',
  amount = '₹3,45,000',
}) => {
  const [walletAddress, setWalletAddress] = useState(initialWalletAddress);
  const [caseId, setCaseId] = useState(initialCaseId);
  const [currentStage, setCurrentStage] = useState(0);
  const [nextEscalationAt, setNextEscalationAt] = useState(null);
  const [lastEscalationAt, setLastEscalationAt] = useState(null);
  const [status, setStatus] = useState('IDLE'); // 'IDLE' | 'PENDING' | 'FROZEN' | 'ESCALATED'
  const [vaspReply, setVaspReply] = useState(false);
  const [escalationLogs, setEscalationLogs] = useState([]);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [isFiuReported, setIsFiuReported] = useState(false);
  const [freezeReceipt, setFreezeReceipt] = useState(null);

  // References for active jobs and timers
  const escalationTimerRef = useRef(null);
  const bullMQJobRef = useRef(null);
  const previousWalletRef = useRef(null);

  /**
   * resetEscalationLadder
   * Clears frontend timers, cancels BullMQ job reference,
   * and resets UI state machine.
   */
  const resetEscalationLadder = useCallback(async () => {
    // 1. Clear all frontend timers
    if (escalationTimerRef.current) {
      clearInterval(escalationTimerRef.current);
      clearTimeout(escalationTimerRef.current);
      escalationTimerRef.current = null;
    }
    if (bullMQJobRef.current) {
      try {
        if (typeof bullMQJobRef.current.remove === 'function') {
          await bullMQJobRef.current.remove();
        }
      } catch (err) {
        console.warn('[InvestigationContext] bullMQJob removal warning:', err);
      }
      bullMQJobRef.current = null;
    }

    // 2. Reset UI states
    setCurrentStage(0);
    setNextEscalationAt(null);
    setEscalationLogs([]);
    setStatus('IDLE');
    setVaspReply(false);
  }, []);

  /**
   * startNewLadder
   * Starts fresh Stage 0 statutory ladder for target wallet.
   * Guard: If status='FROZEN', still reset to PENDING for new wallet.
   * Guard: Don't reuse old caseId logs for new wallet.
   */
  const startNewLadder = useCallback(
    async (newWallet) => {
      if (!newWallet) return;
      const now = new Date();
      const nextTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

      // Guard: Reset to PENDING for new wallet even if old status was FROZEN
      setCurrentStage(0);
      setNextEscalationAt(nextTime);
      setLastEscalationAt(now.toISOString());
      setStatus('PENDING');
      setVaspReply(false);

      // Fresh Stage 0 statutory audit log
      const initialLog = {
        id: `LOG_${Date.now()}_0`,
        case_id: firNumber || caseId,
        stage: 0,
        action_taken: `STAGE 0: Section 91 CrPC notice dispatched to ${vaspName} for new wallet ${newWallet}`,
        recipient_email: vaspEmail,
        escalated_at: now.toISOString(),
        details: `Statutory 30-minute countdown active until ${nextTime}. Status: PENDING.`,
      };
      setEscalationLogs([initialLog]);

      // Call API endpoint on wallet change: POST /api/cases/:id/wallet-change
      try {
        const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/wallet-change`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newWalletAddress: newWallet,
            oldWalletAddress: previousWalletRef.current,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.next_escalation_at) {
            setNextEscalationAt(data.next_escalation_at);
          }
          if (data.current_stage !== undefined) {
            setCurrentStage(data.current_stage);
          }
          if (data.status) {
            setStatus(data.status);
          }
          if (Array.isArray(data.logs)) {
            setEscalationLogs(data.logs);
          }
        }
      } catch (err) {
        console.log('[InvestigationContext] Local/Vite mode active (/api/cases/:id/wallet-change handled locally).', err.message);
      }
    },
    [caseId, firNumber, vaspName, vaspEmail]
  );

  /**
   * Watch walletAddress changes:
   * Triggers resetEscalationLadder() and startNewLadder(walletAddress)
   */
  useEffect(() => {
    if (!walletAddress) return;
    if (previousWalletRef.current === walletAddress) return;

    previousWalletRef.current = walletAddress;
    resetEscalationLadder();
    startNewLadder(walletAddress);
  }, [walletAddress, resetEscalationLadder, startNewLadder]);

  // Live countdown clock ticker: timeRemaining = nextEscalationAt - NOW()
  useEffect(() => {
    const updateTicker = () => {
      if (vaspReply || status === 'FROZEN' || !nextEscalationAt) {
        setTimeRemainingSeconds(0);
        return;
      }
      const now = Date.now();
      const targetTime = new Date(nextEscalationAt).getTime();
      const diffSec = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimeRemainingSeconds(diffSec);
    };

    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [nextEscalationAt, vaspReply, status]);

  // VASP Reply Handler: Freezes ladder immediately
  const handleVaspReply = useCallback((replyDetails = null) => {
    setVaspReply(true);
    setStatus('FROZEN');
    setFreezeReceipt({
      freezeId: `FRZ-IND-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      confirmedBy: `${vaspName} Legal Operations Node`,
      frozenAmount: amount,
      targetWallet: walletAddress,
      status: 'STATUTORY_FREEZE_ACKNOWLEDGED',
      ...(replyDetails || {}),
    });

    const freezeLog = {
      id: `LOG_${Date.now()}_FROZEN`,
      case_id: firNumber || caseId,
      stage: currentStage,
      action_taken: `HALTED: VASP Acknowledged Statutory Preservation - Funds Frozen`,
      recipient_email: vaspEmail,
      escalated_at: new Date().toISOString(),
      details: `VASP response confirmed. Status transitioned to FROZEN. Escalation queue stopped.`,
    };
    setEscalationLogs((prev) => [...prev, freezeLog]);
  }, [vaspName, amount, walletAddress, firNumber, caseId, currentStage, vaspEmail]);

  // Run Cron Check (SELECT * FROM escalation_cases WHERE next_escalation_at <= NOW() AND vasp_reply_received = false AND status = 'PENDING')
  const run1MinCronCheck = useCallback(() => {
    if (vaspReply || status === 'FROZEN') {
      return { skipped: true, reason: 'Case is FROZEN' };
    }
    if (currentStage >= 4 || status === 'ESCALATED') {
      return { skipped: true, reason: 'Terminal Stage reached' };
    }
    if (!nextEscalationAt) {
      return { skipped: true, reason: 'No next_escalation_at set' };
    }

    const now = Date.now();
    const targetMs = new Date(nextEscalationAt).getTime();
    if (targetMs > now) {
      return { skipped: true, reason: 'Interval not yet elapsed' };
    }

    executeEscalation(currentStage + 1);
    return { evaluated: true, escalatedTo: currentStage + 1 };
  }, [vaspReply, status, currentStage, nextEscalationAt]);

  // Execute Stage Escalation
  const executeEscalation = useCallback((nextStage) => {
    const now = new Date();
    let nextIntervalMs = 0;
    let actionDesc = '';
    let targetStatus = 'PENDING';

    switch (nextStage) {
      case 1:
        nextIntervalMs = 2 * 60 * 60 * 1000;
        actionDesc = 'STAGE 1: 94 BNSS 7-Day Preservation Order + Sec 211 BNS Penal Threat Served';
        break;
      case 2:
        nextIntervalMs = 22 * 60 * 60 * 1000;
        actionDesc = 'STAGE 2: Multi-Agency Escalation to FIU-IND, I4C Nodal & NCRP with Linked FIRs PDF';
        setIsFiuReported(true);
        break;
      case 3:
        nextIntervalMs = 6 * 24 * 60 * 60 * 1000;
        actionDesc = 'STAGE 3: Judicial Seizure Application u/s 106 BNSS & Sec 17 PMLA filed';
        break;
      case 4:
        nextIntervalMs = 0;
        actionDesc = 'STAGE 4: Recovery Mode activated. UPI ID extracted & Bank Lien API marked u/s 107 BNSS';
        targetStatus = 'ESCALATED';
        break;
      default:
        return;
    }

    const nextDateStr = nextIntervalMs > 0 ? new Date(now.getTime() + nextIntervalMs).toISOString() : null;

    setCurrentStage(nextStage);
    setLastEscalationAt(now.toISOString());
    setNextEscalationAt(nextDateStr);
    setStatus(targetStatus);

    const logEntry = {
      id: `LOG_${Date.now()}_${nextStage}`,
      case_id: firNumber || caseId,
      stage: nextStage,
      action_taken: actionDesc,
      recipient_email: nextStage === 2 ? 'compliance@wazirx.com, nodal@i4c.mha.gov.in, fiu-ind@gov.in' : vaspEmail,
      escalated_at: now.toISOString(),
      details: `Escalated from Stage ${nextStage - 1} to Stage ${nextStage}. Next escalation: ${nextDateStr || 'TERMINAL'}`,
    };

    setEscalationLogs((prev) => [...prev, logEntry]);
  }, [firNumber, caseId, vaspEmail]);

  // Fast forward timer for testing
  const matureTimerForTesting = useCallback(() => {
    const pastTime = new Date(Date.now() - 5000).toISOString();
    setNextEscalationAt(pastTime);
  }, []);

  const value = {
    walletAddress,
    setWalletAddress,
    caseId,
    setCaseId,
    currentStage,
    setCurrentStage,
    nextEscalationAt,
    setNextEscalationAt,
    lastEscalationAt,
    status,
    setStatus,
    vaspReply,
    setVaspReply,
    escalationLogs,
    setEscalationLogs,
    timeRemainingSeconds,
    isFiuReported,
    freezeReceipt,
    resetEscalationLadder,
    startNewLadder,
    handleVaspReply,
    run1MinCronCheck,
    executeEscalation,
    matureTimerForTesting,
    escalationTimerRef,
    bullMQJobRef,
    vaspName,
    vaspEmail,
    amount,
    firNumber,
  };

  return (
    <InvestigationContext.Provider value={value}>
      {children}
    </InvestigationContext.Provider>
  );
};

export const useInvestigation = () => {
  const context = useContext(InvestigationContext);
  if (!context) {
    // Return graceful fallback state if outside provider
    return {
      walletAddress: '',
      setWalletAddress: () => {},
      currentStage: 0,
      nextEscalationAt: null,
      status: 'IDLE',
      vaspReply: false,
      escalationLogs: [],
      timeRemainingSeconds: 0,
      resetEscalationLadder: async () => {},
      startNewLadder: async () => {},
      handleVaspReply: () => {},
      run1MinCronCheck: () => {},
      executeEscalation: () => {},
      matureTimerForTesting: () => {},
    };
  }
  return context;
};
