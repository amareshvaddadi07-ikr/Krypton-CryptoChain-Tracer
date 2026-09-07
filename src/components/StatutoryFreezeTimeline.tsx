import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  ShieldCheck,
  Mail,
  Copy,
  ExternalLink,
  FileText,
  Download,
  AlertOctagon,
  FileCheck2,
  Building2,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCheck,
  ArrowRight,
  Landmark,
  Scale,
  Send,
  Zap,
  Terminal,
  Layers,
  Database,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CaseData } from '../types';

export const vaspEmails: Record<string, string> = {
  Binance: 'compliance@binance.com',
  WazirX: 'compliance@wazirx.com',
  CoinDCX: 'compliance@coindcx.com',
  CoinSwitch: 'compliance@coinswitch.co',
};

export interface MailData {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

// 33 NCRP FIRs Corroborated across India
export const MULE_33_FIRS = [
  { sNo: 1, fir: 'NCRP/2025/0847', ps: 'Cyber Crime PS, Visakhapatnam, AP', amount: '₹4,20,000', complainant: 'R. K. Murthy' },
  { sNo: 2, fir: 'NCRP/2025/0921', ps: 'Cyber Crime PS, Hyderabad, TG', amount: '₹3,10,000', complainant: 'S. Venkat Rao' },
  { sNo: 3, fir: 'NCRP/2025/1104', ps: 'Cyber Crime PS, Vijayawada, AP', amount: '₹6,50,000', complainant: 'A. Lakshmi' },
  { sNo: 4, fir: 'NCRP/2025/1330', ps: 'Cyberabad Police, TG', amount: '₹5,80,000', complainant: 'K. Pradeep' },
  { sNo: 5, fir: 'NCRP/2025/1412', ps: 'CCPS Bengaluru Central, KA', amount: '₹8,40,000', complainant: 'D. Srinivas' },
  { sNo: 6, fir: 'NCRP/2025/1489', ps: 'Cyber Crime, Chennai South, TN', amount: '₹3,90,000', complainant: 'M. Anand' },
  { sNo: 7, fir: 'NCRP/2025/1532', ps: 'Special Cell Cyber, New Delhi', amount: '₹9,20,000', complainant: 'V. Sharma' },
  { sNo: 8, fir: 'NCRP/2025/1601', ps: 'Cyber Police Station, BKC Mumbai, MH', amount: '₹11,50,000', complainant: 'P. Mehta' },
  { sNo: 9, fir: 'NCRP/2025/1677', ps: 'Cyber Cell, Gurugram, HR', amount: '₹4,75,000', complainant: 'R. Tyagi' },
  { sNo: 10, fir: 'NCRP/2025/1744', ps: 'Cyber Crime Cell, Kolkata, WB', amount: '₹5,10,000', complainant: 'T. Banerjee' },
  { sNo: 11, fir: 'NCRP/2025/1802', ps: 'Cyber Crime PS, Guntur, AP', amount: '₹3,60,000', complainant: 'N. Prasad' },
  { sNo: 12, fir: 'NCRP/2025/1890', ps: 'Cyber Crime PS, Tirupati, AP', amount: '₹4,40,000', complainant: 'S. Reddy' },
  { sNo: 13, fir: 'NCRP/2025/1954', ps: 'Cyber Cell, Pune, MH', amount: '₹6,20,000', complainant: 'A. Kulkarni' },
  { sNo: 14, fir: 'NCRP/2025/2011', ps: 'Cyber Crime PS, Warangal, TG', amount: '₹2,95,000', complainant: 'G. Suresh' },
  { sNo: 15, fir: 'NCRP/2025/2099', ps: 'Cyber Crime PS, Kochi, KL', amount: '₹4,80,000', complainant: 'J. Thomas' },
  { sNo: 16, fir: 'NCRP/2025/2145', ps: 'Cyber Crime PS, Coimbatore, TN', amount: '₹3,70,000', complainant: 'K. Raman' },
  { sNo: 17, fir: 'NCRP/2025/2208', ps: 'Cyber Crime PS, Ahmedabad, GJ', amount: '₹7,10,000', complainant: 'B. Patel' },
  { sNo: 18, fir: 'NCRP/2025/2274', ps: 'Cyber Cell, Jaipur, RJ', amount: '₹4,50,000', complainant: 'M. Singh' },
  { sNo: 19, fir: 'NCRP/2025/2339', ps: 'Cyber Crime PS, Lucknow, UP', amount: '₹5,30,000', complainant: 'S. Dixit' },
  { sNo: 20, fir: 'NCRP/2025/2401', ps: 'Cyber Crime PS, Noida, UP', amount: '₹6,90,000', complainant: 'R. Gupta' },
  { sNo: 21, fir: 'NCRP/2025/2488', ps: 'Cyber Cell, Chandigarh', amount: '₹3,40,000', complainant: 'H. Dhillon' },
  { sNo: 22, fir: 'NCRP/2025/2530', ps: 'Cyber Crime PS, Bhopal, MP', amount: '₹4,10,000', complainant: 'A. Chouhan' },
  { sNo: 23, fir: 'NCRP/2025/2612', ps: 'Cyber Crime PS, Patna, BR', amount: '₹5,60,000', complainant: 'K. Kumar' },
  { sNo: 24, fir: 'NCRP/2025/2690', ps: 'Cyber Crime PS, Bhubaneswar, OD', amount: '₹3,85,000', complainant: 'P. Mohanty' },
  { sNo: 25, fir: 'NCRP/2025/2744', ps: 'Cyber Crime PS, Raipur, CG', amount: '₹3,20,000', complainant: 'D. Sahu' },
  { sNo: 26, fir: 'NCRP/2025/2810', ps: 'Cyber Crime PS, Ranchi, JH', amount: '₹4,60,000', complainant: 'M. Oraon' },
  { sNo: 27, fir: 'NCRP/2025/2895', ps: 'Cyber Crime PS, Guwahati, AS', amount: '₹3,75,000', complainant: 'B. Das' },
  { sNo: 28, fir: 'NCRP/2025/2940', ps: 'Cyber Crime PS, Rajahmundry, AP', amount: '₹5,00,000', complainant: 'T. Rama Rao' },
  { sNo: 29, fir: 'NCRP/2025/3015', ps: 'Cyber Crime PS, Kurnool, AP', amount: '₹3,80,000', complainant: 'B. Narasimha' },
  { sNo: 30, fir: 'NCRP/2025/3089', ps: 'Cyber Crime PS, Nizamabad, TG', amount: '₹4,15,000', complainant: 'C. Srinivas' },
  { sNo: 31, fir: 'NCRP/2025/3155', ps: 'Cyber Crime PS, Mangaluru, KA', amount: '₹6,00,000', complainant: 'R. Shetty' },
  { sNo: 32, fir: 'NCRP/2025/3220', ps: 'Cyber Crime PS, Mysuru, KA', amount: '₹4,30,000', complainant: 'P. Hegde' },
  { sNo: 33, fir: 'NCRP/2025/8847', ps: 'Cyber Crime PS, Visakhapatnam, AP', amount: '₹3,45,000', complainant: 'Investigating Subject FIR' },
];

export function getMailData(
  action: '91CrPC' | '94BNSS' | 'fiu-ind' | 'sbi-lien',
  vaspName: string,
  walletAddress: string,
  firNumber: string,
  amount: string = '₹3,45,000'
): MailData {
  const recipientEmail = vaspEmails[vaspName] || 'compliance@wazirx.com';

  switch (action) {
    case '91CrPC':
      return {
        to: recipientEmail,
        cc: 'cybercrime-ap@ap.gov.in, cid-cyber@ap.police.gov.in',
        subject: `URGENT: Legal Freeze Requisition u/s 91 CrPC - FIR ${firNumber} - Wallet ${walletAddress}`,
        body: `To: Legal & Compliance Department, ${vaspName}
Subject: Statutory Freeze Requisition u/s 91 CrPC for Wallet ${walletAddress}
Quantum: ${amount}

Under Section 91 CrPC, you are requested to debit-freeze the designated digital asset account and associated deposit address immediately.

1. Urgent statutory requisition issued in connection with cyber crime investigation under FIR No. ${firNumber}.
2. Immediate debit-freeze on target wallet: ${walletAddress}
3. Preserve all transaction metadata, IP logs, device IDs, and linked fiat INR bank settlement details.
4. Furnish complete KYC documentation within 24 hours.

Failure to comply shall attract penal liabilities under statutory framework.

Inspector of Police,
Cyber Crime Investigation Cell, CID`,
      };

    case '94BNSS':
      return {
        to: recipientEmail,
        cc: 'fiu-ind@fiuindia.gov.in, cybercrime-ap@ap.gov.in',
        subject: `ESCALATION: 94 BNSS 7-Day Preservation + Sec 211 BNS Penal Notice - FIR ${firNumber} - Wallet ${walletAddress}`,
        body: `To: Legal & Compliance Department, ${vaspName}
Copy to: Financial Intelligence Unit - India (FIU-IND)

As per 30-min SLA non-compliance to Section 91 CrPC, this is formal escalation under Section 94 of Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.

You are hereby ordered to enforce a mandatory 7-Day Statutory Preservation and complete transaction hold on target wallet ${walletAddress} (Amount: ${amount}).

PENAL WARNING: Non-compliance attracts Section 211 BNS (Disobedience to order duly promulgated by public servant - imprisonment up to 1 year and fine).

Inspector of Police,
Cyber Crime Investigation Cell`,
      };

    case 'fiu-ind':
      return {
        to: 'int-reports@fiuindia.gov.in, fiu@fiuindia.gov.in, nodalofficer@wazirx.com, grievance@wazirx.com',
        cc: 'compliance@wazirx.com, nodal-i4c@mha.gov.in',
        subject: `FIU-IND Escalation: Non-compliant VASP ${vaspName} - FIR ${firNumber} - 33 Inter-State Mule FIRs Attached`,
        body: `To: Financial Intelligence Unit - India (FIU-IND) & Nodal Officers
Copy to: ${vaspName} Compliance & I4C-MHA

SUBJECT: FIU-IND Escalation: Non-compliant VASP ${vaspName} - FIR ${firNumber} - 33 Inter-State Mule FIRs Attached

Sir/Madam,
Under ongoing investigation into FIR No. ${firNumber}, this is to report statutory non-compliance by registered VASP ${vaspName}.

Target Beneficiary Wallet: ${walletAddress}
Traced Fraud Quantum: ${amount}

ATTACHED EVIDENCE: National Mule Registry Report with 33 linked NCRP cases across AP, TG, KA, MH, DL totaling ₹1.82 Crore.

As per IT Rules 2021, Nodal Officer must reply within 24 hours. Regulatory enforcement requested.

Inspector of Police,
Cyber Crime Police Station / CID`,
      };

    case 'sbi-lien':
      return {
        to: 'mvpbranch.manager@sbi.co.in, dgm.cybercrime@sbi.co.in',
        cc: 'cybercrime-ap@ap.gov.in, nodal.cyber@sbi.co.in',
        subject: `Section 91 CrPC - Immediate UPI Lien Marking & Debit Freeze - SBI Account XXXX1234 - FIR ${firNumber}`,
        body: `To: Branch Manager, State Bank of India (SBI) MVP Colony Branch, Visakhapatnam
Copy to: Cyber Crime Nodal Desk, State Bank of India & AP CID

Subject: Statutory Requisition u/s 91 CrPC for Immediate 100% Lien Marking on Account XXXX1234
Ref: FIR No. ${firNumber} (Cyber Crime Police Station)

Sir/Madam,
During on-chain crypto off-ramp tracing from ${vaspName}, illicit proceeds of ${amount} were liquidated via P2P / fast IMPS into beneficiary SBI Account XXXX1234 linked to UPI handle mule.investigations99@oksbi.

Under Section 91 CrPC and Section 107 BNSS:
1. Mark immediate 100% debit freeze / lien on SBI Account XXXX1234 for ₹${amount}.
2. Preserve account statement, KYC records, registered mobile, and ATM/IP access logs.
3. Keep funds sequestered pending Section 107 BNSS restitution order by Chief Judicial Magistrate.

Inspector of Police,
Cyber Crime Investigation Cell, Visakhapatnam`,
      };
  }
}

export interface StatutoryFreezeTimelineProps {
  vaspName?: string;
  vaspEmail?: string;
  walletAddress?: string;
  firNumber?: string;
  amount?: string;
  caseData?: CaseData;
  onGenerateProtocol?: () => void;
  isGeneratingPdf?: boolean;
}

// Safe localStorage wrapper to prevent crashes in restricted iframe environments
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  },
};

export const StatutoryFreezeTimeline: React.FC<StatutoryFreezeTimelineProps> = ({
  vaspName = 'WazirX',
  vaspEmail = 'compliance@wazirx.com',
  walletAddress = 'TLa2w8q6e4r2t1y7u8i9o0p1a2s3d4f8c9',
  firNumber = 'NCRP/2025/8847',
  amount = '₹3,45,000',
  caseData,
  onGenerateProtocol,
  isGeneratingPdf = false,
}) => {
  // =========================================================================
  // STATUTORY AUTO-ESCALATION LADDER: PERSISTENT DB STATE SCHEMA
  // Fields: current_stage, next_escalation_at, status, last_escalation_at, vasp_reply_received
  // =========================================================================
  const [escalationStage, setEscalationStage] = useState<number>(() => {
    const saved = safeStorage.getItem('escalation_current_stage');
    return saved !== null ? Number(saved) : 0;
  });

  const [nextEscalationAt, setNextEscalationAt] = useState<string | null>(() => {
    const saved = safeStorage.getItem('escalation_next_at');
    if (saved) return saved;
    // Default: exactly 30 minutes from now for Stage 0 (Statutory 91 CrPC)
    return new Date(Date.now() + 30 * 60 * 1000).toISOString();
  });

  const [lastEscalationAt, setLastEscalationAt] = useState<string | null>(() => {
    return safeStorage.getItem('escalation_last_at') || new Date().toISOString();
  });

  const [escalationStatus, setEscalationStatus] = useState<'PENDING' | 'FROZEN' | 'ESCALATED'>(() => {
    const saved = safeStorage.getItem('escalation_status');
    return (saved as any) || 'PENDING';
  });

  // VASP Reply Condition (IF vasp_reply == true -> STOP (Frozen))
  const [vaspReply, setVaspReply] = useState<boolean>(() => {
    return safeStorage.getItem('escalation_vasp_reply') === 'true';
  });

  const [freezeReceipt, setFreezeReceipt] = useState<{
    freezeId: string;
    timestamp: string;
    confirmedBy: string;
    frozenAmount: string;
    targetWallet: string;
    status: string;
  } | null>(() => {
    const saved = safeStorage.getItem('escalation_freeze_receipt');
    return saved ? JSON.parse(saved) : null;
  });

  // Statutory Audit & Escalation Logs: Logs each stage with timestamp to prove wait happened
  const [escalationLogs, setEscalationLogs] = useState<Array<{
    id: string;
    stage: number;
    action_taken: string;
    recipient_email: string;
    escalated_at: string;
    details: string;
  }>>(() => {
    const saved = safeStorage.getItem('escalation_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    const initialTime = new Date().toISOString();
    return [
      {
        id: 'LOG_INIT_0',
        stage: 0,
        action_taken: 'STAGE 0: Preliminary Section 91 CrPC Requisition Issued to VASP Compliance',
        recipient_email: vaspEmail,
        escalated_at: initialTime,
        details: 'Mandatory 30-minute statutory countdown initiated. Case status: PENDING.',
      },
    ];
  });

  // Live UI Countdown: time_remaining = next_escalation_at - NOW()
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(() => {
    if (!nextEscalationAt) return 0;
    const diff = new Date(nextEscalationAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  // State-specific flags
  const [isFiuReported, setIsFiuReported] = useState<boolean>(() => {
    return safeStorage.getItem('escalation_fiu_reported') === 'true';
  });
  const [sbiLienSent, setSbiLienSent] = useState<boolean>(false);
  const [lienApiStatus, setLienApiStatus] = useState<'idle' | 'calling' | 'success'>('idle');
  const [lienToken, setLienToken] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dispatched feedback
  const [dispatchedButtons, setDispatchedButtons] = useState<Record<string, boolean>>({});

  // Email draft viewer modal
  const [noticeModal, setNoticeModal] = useState<MailData | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  // Refs for tracking active ladder timers and wallet address changes
  const prevWalletRef = useRef<string | null>(null);
  const escalationTimerRef = useRef<any>(null);
  const bullMQJobRef = useRef<any>(null);

  // Reset escalation ladder function: clears timers, resets UI states,
  // guards: resets FROZEN status to PENDING, clears old logs
  const resetEscalationLadder = useCallback(() => {
    if (escalationTimerRef.current) {
      clearInterval(escalationTimerRef.current);
      clearTimeout(escalationTimerRef.current);
      escalationTimerRef.current = null;
    }
    if (bullMQJobRef.current && typeof bullMQJobRef.current.remove === 'function') {
      bullMQJobRef.current.remove().catch(() => {});
      bullMQJobRef.current = null;
    }

    // Reset UI states
    setEscalationStage(0);
    setNextEscalationAt(null);
    setEscalationLogs([]);
    setEscalationStatus('PENDING'); // Guard: If status='FROZEN', still reset to PENDING for new wallet!
    setVaspReply(false);
    setFreezeReceipt(null);
    setIsFiuReported(false);
    setSbiLienSent(false);
    setLienApiStatus('idle');
    setLienToken(null);
  }, []);

  // Start fresh Stage 0 statutory ladder for target wallet
  const startNewLadder = useCallback(
    async (targetWallet: string) => {
      if (!targetWallet) return;
      const now = new Date();
      const nextTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

      setEscalationStage(0);
      setNextEscalationAt(nextTime);
      setLastEscalationAt(now.toISOString());
      setEscalationStatus('PENDING');
      setVaspReply(false);
      setFreezeReceipt(null);

      // Fresh Stage 0 statutory log (Don't reuse old case logs for new wallet)
      const freshLog = {
        id: `LOG_${Date.now()}_0`,
        stage: 0,
        action_taken: `STAGE 0: Preliminary Section 91 CrPC Requisition Issued to ${vaspName} for wallet ${targetWallet}`,
        recipient_email: vaspEmail,
        escalated_at: now.toISOString(),
        details: `Statutory 30-minute countdown active until ${nextTime}. Status: PENDING.`,
      };
      setEscalationLogs([freshLog]);
      safeStorage.setItem('escalation_target_wallet', targetWallet);

      // Call API endpoint on wallet change: POST /api/cases/:id/wallet-change
      try {
        const caseId = firNumber || 'NCRP/2025/8847';
        await fetch(`/api/cases/${encodeURIComponent(caseId)}/wallet-change`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newWalletAddress: targetWallet }),
        });
      } catch (err) {
        // Handled locally
      }
    },
    [vaspName, vaspEmail, firNumber]
  );

  // Statutory State Machine restart on walletAddress change:
  // Runs resetEscalationLadder() and startNewLadder(walletAddress)
  useEffect(() => {
    if (!walletAddress) return;
    if (prevWalletRef.current === null) {
      const stored = safeStorage.getItem('escalation_target_wallet');
      prevWalletRef.current = walletAddress;
      if (stored && stored !== walletAddress) {
        resetEscalationLadder();
        startNewLadder(walletAddress);
      } else if (!stored) {
        safeStorage.setItem('escalation_target_wallet', walletAddress);
      }
      return;
    }

    if (prevWalletRef.current !== walletAddress) {
      prevWalletRef.current = walletAddress;
      resetEscalationLadder();
      startNewLadder(walletAddress);
      showToast(`⚡ Statutory ladder restarted for new wallet: ${walletAddress.slice(0, 10)}...`);
    }
  }, [walletAddress, resetEscalationLadder, startNewLadder]);

  // Synchronize reset when triggered via global event (e.g. from Hero or FIRContext)
  useEffect(() => {
    const handleResetLadderEvent = (e: any) => {
      resetEscalationLadder();
      if (e?.detail?.newWallet) {
        prevWalletRef.current = e.detail.newWallet;
        startNewLadder(e.detail.newWallet);
      }
    };
    window.addEventListener('krypton:reset-ladder', handleResetLadderEvent);
    return () => window.removeEventListener('krypton:reset-ladder', handleResetLadderEvent);
  }, [resetEscalationLadder, startNewLadder]);

  // Sync to safeStorage so jobs/timers are never lost across page/server refresh
  useEffect(() => {
    safeStorage.setItem('escalation_current_stage', String(escalationStage));
    if (nextEscalationAt) {
      safeStorage.setItem('escalation_next_at', nextEscalationAt);
    } else {
      safeStorage.removeItem('escalation_next_at');
    }
    if (lastEscalationAt) {
      safeStorage.setItem('escalation_last_at', lastEscalationAt);
    }
    safeStorage.setItem('escalation_status', escalationStatus);
    safeStorage.setItem('escalation_vasp_reply', String(vaspReply));
    safeStorage.setItem('escalation_fiu_reported', String(isFiuReported));
    safeStorage.setItem('escalation_logs', JSON.stringify(escalationLogs));
    if (freezeReceipt) {
      safeStorage.setItem('escalation_freeze_receipt', JSON.stringify(freezeReceipt));
    } else {
      safeStorage.removeItem('escalation_freeze_receipt');
    }
  }, [escalationStage, nextEscalationAt, lastEscalationAt, escalationStatus, vaspReply, isFiuReported, escalationLogs, freezeReceipt]);

  // LIVE COUNTDOWN TIMER: time_remaining = next_escalation_at - NOW()
  // PURE CLOCK TICKER - NO automatic setTimeout() or premature stage skipping!
  useEffect(() => {
    const updateCountdown = () => {
      if (vaspReply || escalationStatus === 'FROZEN' || !nextEscalationAt) {
        setTimeRemainingSeconds(0);
        return;
      }
      const now = Date.now();
      const targetTime = new Date(nextEscalationAt).getTime();
      const diffSec = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimeRemainingSeconds(diffSec);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextEscalationAt, vaspReply, escalationStatus]);

  // State duration labels & statutory intervals
  const getStateDurations = (stage: number) => {
    switch (stage) {
      case 0:
        return { label: '30m Timer', total: '0m ➔ 30m', intervalName: '30 Minutes', intervalMs: 30 * 60 * 1000 };
      case 1:
        return { label: '2h Interval', total: '30m ➔ 2h', intervalName: '2 Hours (for stage 1->2)', intervalMs: 2 * 60 * 60 * 1000 };
      case 2:
        return { label: '22h Interval', total: '2h ➔ 24h', intervalName: '22 Hours (for stage 2->3)', intervalMs: 22 * 60 * 60 * 1000 };
      case 3:
        return { label: '6-day Interval', total: '24h ➔ 7 days', intervalName: '6 Days (for stage 3->4)', intervalMs: 6 * 24 * 60 * 60 * 1000 };
      case 4:
        return { label: 'Recovery Mode', total: '7+ Days', intervalName: 'Terminal Restitution', intervalMs: 0 };
      default:
        return { label: '30m Timer', total: '30m', intervalName: '30 Minutes', intervalMs: 1800000 };
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4500);
  };

  const triggerButtonFeedback = (key: string) => {
    setDispatchedButtons((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setDispatchedButtons((prev) => ({ ...prev, [key]: false }));
    }, 3000);
  };

  const formatSeconds = (totalSecs: number) => {
    if (totalSecs <= 0) return '00:00:00';
    const d = Math.floor(totalSecs / (3600 * 24));
    const rem = totalSecs % (3600 * 24);
    const h = Math.floor(rem / 3600);
    const m = Math.floor((rem % 3600) / 60);
    const s = rem % 60;
    if (d > 0) {
      return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // =========================================================================
  // CRON ENGINE SIMULATION: SELECT * FROM escalation_cases WHERE next_escalation_at <= NOW() AND vasp_reply_received = false AND status = 'PENDING'
  // ONLY THOSE ROWS SHOULD ESCALATE.
  // =========================================================================
  const handleRun1MinCronCheck = () => {
    const now = Date.now();

    // Condition 1: If vasp_reply_received = true, set status='FROZEN' and STOP queue
    if (vaspReply || escalationStatus === 'FROZEN') {
      showToast('CRON [HALTED]: vasp_reply_received = true. Case is FROZEN. Escalation stopped.');
      return;
    }

    // Condition 2: Check if Terminal Stage 4
    if (escalationStage >= 4 || escalationStatus === 'ESCALATED') {
      showToast('CRON [TERMINAL]: Case has reached Terminal Stage 4 (Recovery Mode).');
      return;
    }

    // Condition 3: Check if next_escalation_at exists
    if (!nextEscalationAt) {
      showToast('CRON: next_escalation_at is null.');
      return;
    }

    const targetTime = new Date(nextEscalationAt).getTime();

    // Condition 4: next_escalation_at MUST be <= NOW()
    if (targetTime > now) {
      const waitSec = Math.floor((targetTime - now) / 1000);
      showToast(`CRON [STATUTORY WAIT ENFORCED]: next_escalation_at is in future (${formatSeconds(waitSec)} remaining). Escalation rejected.`);
      return;
    }

    // All conditions satisfied: next_escalation_at <= NOW() AND vasp_reply_received = false AND status = 'PENDING'
    executeEscalation(escalationStage + 1);
  };

  // Perform statutory escalation to next stage
  const executeEscalation = (nextStage: number) => {
    const now = new Date();
    const prevStage = escalationStage;

    let nextIntervalMs = 0;
    let actionDesc = '';
    let targetStatus: 'PENDING' | 'FROZEN' | 'ESCALATED' = 'PENDING';

    switch (nextStage) {
      case 1:
        // Stage 1: 94 BNSS + Sec 211 BNS threat
        // Next timer: 2 HOURS for stage 1->2
        nextIntervalMs = 2 * 60 * 60 * 1000;
        actionDesc = 'STAGE 1: 94 BNSS 7-Day Preservation Order + Sec 211 BNS Penal Threat Served';
        break;

      case 2:
        // Stage 2: Trigger FIU-IND + NCRP + Email to Nodal with 33 FIRs PDF
        // Next timer: 22 HOURS for stage 2->3
        nextIntervalMs = 22 * 60 * 60 * 1000;
        actionDesc = 'STAGE 2: Multi-Agency Escalation to FIU-IND, I4C Nodal & NCRP with 33 Linked FIRs PDF';
        setIsFiuReported(true);
        break;

      case 3:
        // Stage 3: Auto-generate 106 BNSS + PMLA 17 draft with Graph as Annexure-A
        // Next timer: 6 DAYS for stage 3->4
        nextIntervalMs = 6 * 24 * 60 * 60 * 1000;
        actionDesc = 'STAGE 3: Judicial Seizure Application u/s 106 BNSS & Sec 17 PMLA filed with Annexure-A Flow Graph';
        break;

      case 4:
        // Stage 4: Recovery Mode - Extract UPI ID from WazirX trade history -> Bank Lien API + 107 BNSS
        nextIntervalMs = 0;
        actionDesc = 'STAGE 4: Recovery Mode activated. UPI ID extracted & Bank Lien API marked u/s 107 BNSS';
        targetStatus = 'ESCALATED';
        break;
      default:
        return;
    }

    const nextEscalationDateStr = nextIntervalMs > 0 ? new Date(now.getTime() + nextIntervalMs).toISOString() : null;

    // a) Send notice email / trigger
    // b) UPDATE current_stage = current_stage + 1
    setEscalationStage(nextStage);
    setLastEscalationAt(now.toISOString());
    // c) UPDATE next_escalation_at = NOW() + INTERVAL
    setNextEscalationAt(nextEscalationDateStr);
    setEscalationStatus(targetStatus);

    // d) INSERT into escalation_logs with exact timestamp to prove wait happened
    const newLog = {
      id: `LOG_${Date.now()}_${nextStage}`,
      case_id: firNumber,
      stage: nextStage,
      action_taken: actionDesc,
      recipient_email: nextStage === 2 ? 'compliance@wazirx.com, nodal@i4c.mha.gov.in, fiu-ind@gov.in' : vaspEmail,
      escalated_at: now.toISOString(),
      details: `Escalated from Stage ${prevStage} to Stage ${nextStage} after statutory interval elapsed. Next escalation: ${nextEscalationDateStr || 'TERMINAL (Stage 4)'}`,
    };

    setEscalationLogs((prev) => [...prev, newLog]);
    showToast(`✓ Escalated to State ${nextStage}. Logged in audit trail with timestamp.`);
  };

  // Test Mode: Mature timer to NOW() to verify cron escalation without waiting 24 hours
  const handleMatureTimerForTesting = () => {
    const pastTime = new Date(Date.now() - 5000).toISOString();
    setNextEscalationAt(pastTime);
    showToast('⚡ [TEST] next_escalation_at set to NOW(). Click "Run 1-Min Cron Check" to verify cron escalation.');
  };

  // Reset Case State
  const handleResetLadderCase = () => {
    const now = new Date();
    const nextTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    setEscalationStage(0);
    setNextEscalationAt(nextTime);
    setLastEscalationAt(now.toISOString());
    setEscalationStatus('PENDING');
    setVaspReply(false);
    setFreezeReceipt(null);
    setIsFiuReported(false);
    setSbiLienSent(false);
    setLienApiStatus('idle');
    setLienToken(null);

    const initialLog = {
      id: `LOG_RESET_${Date.now()}`,
      stage: 0,
      action_taken: 'STAGE 0: Case Re-initialized with 30-min Section 91 CrPC notice',
      recipient_email: vaspEmail,
      escalated_at: now.toISOString(),
      details: `Case reset. Statutory 30-minute countdown active until ${nextTime}.`,
    };
    setEscalationLogs([initialLog]);
    showToast('Reset case to Stage 0. 30-minute statutory interval initiated.');
  };

  // =========================================================================
  // STATE MACHINE VASP REPLY HANDLER: IF vasp_reply == true -> STOP (Frozen)
  // =========================================================================
  const handleSimulateVaspReply = () => {
    const now = new Date();
    setVaspReply(true);
    setEscalationStatus('FROZEN');
    setNextEscalationAt(null);

    const receipt = {
      freezeId: `WZ-FRZ-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      confirmedBy: `${vaspName} Compliance Operations Desk (Nodal: R. Agrawal)`,
      frozenAmount: amount,
      targetWallet: walletAddress,
      status: 'DEBIT_FREEZE_ENFORCED_COMPLIANT',
    };
    setFreezeReceipt(receipt);

    // Audit log
    const freezeLog = {
      id: `LOG_FREEZE_${Date.now()}`,
      stage: escalationStage,
      action_taken: `VASP REPLY RECEIVED: Debit freeze confirmed on wallet ${walletAddress.slice(0, 12)}...`,
      recipient_email: vaspEmail,
      escalated_at: now.toISOString(),
      details: `Compliance officer confirmed full debit-freeze. Escalation queue HALTED. Token: ${receipt.freezeId}`,
    };
    setEscalationLogs((prev) => [...prev, freezeLog]);
    showToast(`✓ VASP Reply Received! Escalation HALTED at State ${escalationStage}. Wallet is FROZEN.`);
  };

  const handleResumeEscalation = () => {
    const now = new Date();
    const nextTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    setVaspReply(false);
    setEscalationStatus('PENDING');
    setNextEscalationAt(nextTime);
    setFreezeReceipt(null);
    showToast(`Resumed escalation monitoring from State ${escalationStage}`);
  };

  // =========================================================================
  // ACTIONS FOR EACH STATE
  // =========================================================================

  // STATE 0: Send 91 CrPC to compliance@wazirx.com
  const handleState0Action = () => {
    const mailData = getMailData('91CrPC', vaspName, walletAddress, firNumber, amount);
    const mailtoUrl = `mailto:${mailData.to}?cc=${mailData.cc}&subject=${encodeURIComponent(
      mailData.subject
    )}&body=${encodeURIComponent(mailData.body)}`;
    window.open(mailtoUrl, '_blank');

    setNoticeModal(mailData);
    triggerButtonFeedback('stage0');
    showToast(`Section 91 CrPC notice dispatched to ${mailData.to}. 30-min timer active.`);
  };

  // STATE 1: Send 94 BNSS + Sec 211 BNS threat (2-page PDF + email)
  const handleState1Action = () => {
    try {
      const doc = new jsPDF();
      const sanitizedFir = String(firNumber).replace(/[\/\\?%*:|"<>]/g, '_');
      const filename = `94_BNSS_Sec211_BNS_Notice_${sanitizedFir}.pdf`;

      // PAGE 1: Original Section 91 CrPC Requisition
      doc.setFillColor(10, 15, 10);
      doc.rect(0, 0, 210, 22, 'F');
      doc.setTextColor(57, 255, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('GOVERNMENT OF ANDHRA PRADESH // POLICE DEPARTMENT', 14, 10);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 240, 200);
      doc.text(
        'CYBER CRIME POLICE STATION, CID // STATUTORY FREEZE REQUISITION U/S 91 CrPC',
        14,
        16
      );

      let y = 32;
      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(`STATUTORY NOTICE UNDER SECTION 91 CrPC // FIR NO: ${firNumber}`, 14, y);
      y += 6;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date of Issue: ${new Date().toLocaleDateString('en-IN')} | Time: 10:30:00 IST`, 14, y);
      y += 8;

      doc.text(`TO: Compliance & Legal Department, ${vaspName} (${vaspEmail})`, 14, y);
      y += 5;
      doc.text('COPY TO: Nodal Officer I4C (MHA) & Financial Intelligence Unit - India', 14, y);
      y += 8;

      doc.setFillColor(245, 248, 245);
      doc.rect(14, y, 182, 16, 'F');
      doc.setDrawColor(180, 220, 180);
      doc.rect(14, y, 182, 16, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 80, 20);
      doc.text(`TARGET BENEFICIARY WALLET: ${walletAddress}`, 18, y + 6);
      doc.text(`AMOUNT SOUGHT FOR IMMEDIATE SEQUESTRATION: ${amount}`, 18, y + 12);
      y += 22;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      const p1Lines = [
        `1. Whereas the Cyber Crime Police Station is investigating FIR No. ${firNumber} regarding digital asset fraud.`,
        `2. On-chain forensic clustering shows illicit proceeds flowed into Respondent VASP's internal deposit address ${walletAddress}.`,
        `3. Under Section 91 CrPC, you were directed to debit-freeze and hold all tokens credited to the subject address.`,
        `4. You were directed to supply KYC records, IP access logs, and linked fiat settlement accounts within 24 hours.`,
      ];
      p1Lines.forEach((l) => {
        const wrapped = doc.splitTextToSize(l, 182);
        doc.text(wrapped, 14, y);
        y += wrapped.length * 4.5 + 2;
      });

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('INSPECTOR OF POLICE, CYBER CRIME CID', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('(Digital Signature Verified • NCRP Integration Portal)', 14, y + 4);

      // PAGE 2: Section 94 BNSS 7-Day Preservation + Section 211 BNS Penal Order
      doc.addPage();
      doc.setFillColor(180, 20, 20);
      doc.rect(0, 0, 210, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 // SECTION 94 ORDER', 14, 11);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'STATUTORY 7-DAY PRESERVATION ORDER // PENAL CONSEQUENCES U/S 211 BNS',
        14,
        18
      );

      y = 34;
      doc.setFillColor(254, 242, 242);
      doc.rect(14, y, 182, 34, 'F');
      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(1.2);
      doc.rect(14, y, 182, 34, 'S');

      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('STATUTORY ESCALATION UNDER SECTION 94 BNSS & SECTION 211 BNS:', 18, y + 8);

      doc.setFontSize(9);
      const redBoldText = `Under Section 94 BNSS, target wallet ${walletAddress} is directed to be PRESERVED for 7 days pending Magistrate seizure. Non-compliance attracts Section 211 BNS (Disobedience to order duly promulgated by public servant - punishable with imprisonment up to 1 year, fine, or both).`;
      const redLines = doc.splitTextToSize(redBoldText, 174);
      doc.text(redLines, 18, y + 16);

      y += 44;
      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('MANDATORY RESTRAINTS ENFORCED ON VASP / EXCHANGE:', 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const restraints = [
        `1. COMPLETE TOKEN LOCKDOWN: No withdrawal, internal swap, P2P release, or sub-account off-ramping shall be processed for wallet ${walletAddress}.`,
        `2. AMOUNT ATTACHMENT: Traced fraud volume of ${amount} must be moved into a quarantined, sequestered custodial reserve.`,
        `3. FORENSIC PRESERVATION: Immediate retention of complete device fingerprints, IMEI identifiers, KYC PAN tokens, and destination bank routing numbers.`,
        `4. DEEMED EXPIRY: This statutory preservation is enforceable for 7 calendar days or until an Order of Seizure is rendered under Section 106 BNSS.`,
      ];
      restraints.forEach((r) => {
        const lines = doc.splitTextToSize(r, 182);
        doc.text(lines, 14, y);
        y += lines.length * 4.5 + 2;
      });

      y += 14;
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y, 182, 14, 'F');
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.5);
      doc.rect(14, y, 182, 14, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(180, 20, 20);
      doc.text('STATUTORY NOTE: This is preservation, not seizure. Most VASPs comply in 15 mins.', 18, y + 9);

      // Save PDF
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Mailto
      const mailData = getMailData('94BNSS', vaspName, walletAddress, firNumber, amount);
      const mailtoUrl = `mailto:${mailData.to}?cc=${mailData.cc}&subject=${encodeURIComponent(
        mailData.subject
      )}&body=${encodeURIComponent(mailData.body)}`;
      window.open(mailtoUrl, '_blank');

      triggerButtonFeedback('stage1');
      showToast('94 BNSS + Sec 211 BNS notice generated & dispatched. 1.5h timer started.');
    } catch (err) {
      console.error('Failed to generate 94 BNSS PDF:', err);
      showToast('Error generating 94 BNSS PDF');
    }
  };

  // STATE 2: Trigger FIU-IND + NCRP + Email to Nodal with 33 FIRs PDF
  const handleState2Action = () => {
    try {
      showToast('Generating National Mule Registry PDF with 33 Corroborated FIRs...');
      const doc = new jsPDF();
      const sanitizedFir = String(firNumber).replace(/[\/\\?%*:|"<>]/g, '_');
      const filename = `National_Mule_Registry_33_FIRs_Escalation_${sanitizedFir}.pdf`;

      // Header Band
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 24, 'F');
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('FINANCIAL INTELLIGENCE UNIT - INDIA // REGULATORY ESCALATION', 14, 11);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240);
      doc.text(
        'CYBER CRIME CO-ORDINATION CENTRE (I4C) - MHA // 33 INTER-STATE LINKED NCRP FIRS',
        14,
        18
      );

      let y = 34;
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`REGULATORY ACTION: NON-COMPLIANCE BY VASP ${vaspName.toUpperCase()}`, 14, y);
      y += 6;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Subject Wallet: ${walletAddress} | Traced Quantum: ${amount}`, 14, y);
      y += 5;
      doc.text(`Total Multi-Jurisdictional Fraud Footprint: Rs. 1,82,45,000 (33 Corroborated Cases)`, 14, y);
      y += 8;

      // Notice to Nodal Officer
      doc.setFillColor(254, 243, 199);
      doc.rect(14, y, 182, 14, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.rect(14, y, 182, 14, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(180, 83, 9);
      doc.text('STATUTORY DIRECTIVE TO NODAL OFFICER UNDER IT (INTERMEDIARY) RULES, 2021:', 18, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(20, 20, 20);
      doc.text('Mandatory written reply and debit-freeze compliance certificate required within 24 hours.', 18, y + 10);
      y += 20;

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, 182, 7, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('#', 16, y + 5);
      doc.text('FIR NUMBER', 24, y + 5);
      doc.text('POLICE STATION / JURISDICTION', 62, y + 5);
      doc.text('AMOUNT', 135, y + 5);
      doc.text('COMPLAINANT', 160, y + 5);
      y += 7;

      // First 22 rows on Page 1
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      MULE_33_FIRS.slice(0, 22).forEach((item) => {
        doc.text(String(item.sNo), 16, y + 4);
        doc.text(item.fir, 24, y + 4);
        doc.text(item.ps.slice(0, 38), 62, y + 4);
        doc.text(item.amount, 135, y + 4);
        doc.text(item.complainant.slice(0, 20), 160, y + 4);
        doc.setDrawColor(240, 240, 240);
        doc.line(14, y + 5.5, 196, y + 5.5);
        y += 6;
      });

      // Page 2 for remaining FIRs and Statutory Endorsement
      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 18, 'F');
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('NATIONAL MULE REGISTRY // PART-II (CASES 23 TO 33) & STATUTORY CERTIFICATION', 14, 11);

      y = 28;
      // Table Header Page 2
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, 182, 7, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('#', 16, y + 5);
      doc.text('FIR NUMBER', 24, y + 5);
      doc.text('POLICE STATION / JURISDICTION', 62, y + 5);
      doc.text('AMOUNT', 135, y + 5);
      doc.text('COMPLAINANT', 160, y + 5);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      MULE_33_FIRS.slice(22).forEach((item) => {
        doc.text(String(item.sNo), 16, y + 4);
        doc.text(item.fir, 24, y + 4);
        doc.text(item.ps.slice(0, 38), 62, y + 4);
        doc.text(item.amount, 135, y + 4);
        doc.text(item.complainant.slice(0, 20), 160, y + 4);
        doc.setDrawColor(240, 240, 240);
        doc.line(14, y + 5.5, 196, y + 5.5);
        y += 6;
      });

      y += 12;
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y, 182, 22, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, y, 182, 22, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text('OFFICIAL CERTIFICATION & REGULATORY REFERRAL:', 18, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(
        'This dossier is transmitted to FIU-IND for initiation of Section 13 PMLA proceedings against non-compliant reporting entity.',
        18,
        y + 11
      );
      doc.text('Inspector of Police, Cyber Crime Investigation Cell // National Cyber Crime Reporting Portal (NCRP)', 18, y + 16);

      // Download PDF
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Trigger mailto
      const mailData = getMailData('fiu-ind', vaspName, walletAddress, firNumber, amount);
      const mailtoUrl = `mailto:${mailData.to}?cc=${mailData.cc}&subject=${encodeURIComponent(
        mailData.subject
      )}&body=${encodeURIComponent(mailData.body)}`;
      window.open(mailtoUrl, '_blank');

      setIsFiuReported(true);
      triggerButtonFeedback('stage2');
      showToast('33 FIRs Dossier PDF generated & FIU-IND Escalation dispatched! 22h timer active.');
    } catch (err) {
      console.error('Failed to generate 33 FIRs PDF:', err);
      showToast('Error generating 33 FIRs PDF');
    }
  };

  // STATE 3: Auto-generate 106 BNSS + PMLA 17 draft with Graph as Annexure-A for Magistrate
  const handleState3Action = async () => {
    try {
      showToast('Auto-generating 106 BNSS + PMLA Section 17 Judicial Application with Annexure-A...');
      const doc = new jsPDF();
      const sanitizedFir = String(firNumber).replace(/[\/\\?%*:|"<>]/g, '_');
      const filename = `Magistrate_Application_106BNSS_PMLA17_AnnexureA_${sanitizedFir}.pdf`;

      // Header Band
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 22, 'F');
      doc.setTextColor(56, 189, 248);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text('IN THE COURT OF THE PRINCIPAL DISTRICT & SESSIONS JUDGE', 14, 10);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240);
      doc.text(
        'VISAKHAPATNAM // SPECIAL COURT UNDER SECTION 106 BNSS 2023 & SECTION 17 PMLA 2002',
        14,
        16
      );

      let y = 32;
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('CRIMINAL MISCELLANEOUS PETITION NO. _____ / 2025', 14, y);
      y += 5;
      doc.text(`IN CRIME NO. / FIR ${firNumber} OF CYBER CRIME POLICE STATION`, 14, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('STATE OF ANDHRA PRADESH (REPRESENTED BY INVESTIGATING OFFICER)   ... APPLICANT', 14, y);
      y += 5;
      doc.text('                                        VERSUS', 14, y);
      y += 5;
      doc.text(`1. UNKNOWN CYBER OFFENDERS / RECIPIENT BENEFICIARY`, 14, y);
      y += 4.5;
      doc.text(`2. ${vaspName.toUpperCase()} (REGISTERED VASP UNDER FIU-IND)              ... RESPONDENTS`, 14, y);
      y += 8;

      // Petition Box
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 14, 'F');
      doc.setDrawColor(148, 163, 184);
      doc.rect(14, y, 182, 14, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `JUDICIAL PETITION U/S 106 BNSS (OLD 102 CrPC) & SECTION 17 PMLA 2002`,
        18,
        y + 5
      );
      doc.setFontSize(8);
      doc.setTextColor(180, 20, 20);
      doc.text(
        `SEEKING SEIZURE WARRANT FOR WALLET ${walletAddress} - AMOUNT ₹${amount} - ED REFERRAL`,
        18,
        y + 10
      );
      y += 20;

      // Grounds
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      const petitionText = [
        `1. That the Applicant is investigating FIR No. ${firNumber} under BNS 2023, Section 66D IT Act 2000, and Section 3 of PMLA 2002.`,
        `2. Cryptographic tracing established an unbroken flow of ₹${amount} from complainant account through layering hops directly into Respondent No. 2's exchange deposit wallet ${walletAddress}.`,
        `3. That preliminary Section 91 CrPC notice and Section 94 BNSS 7-Day Preservation order were served. Respondent failed to submit compliance certification, creating imminent risk of laundering or overseas off-ramping.`,
        `4. That under Section 106 BNSS and Section 17 PMLA, this Hon'ble Court is prayed to issue a formal Warrant of Judicial Seizure and direct Respondent No. 2 to debit-freeze and deposit ₹${amount} into the Court Cyber Escrow Account.`,
        `5. That since cumulative multi-FIR mule cluster volume exceeds statutory limits, an enforcement referral to the Directorate of Enforcement (ED) under Section 17 PMLA is formally triggered.`,
      ];

      petitionText.forEach((p) => {
        const lines = doc.splitTextToSize(p, 182);
        doc.text(lines, 14, y);
        y += lines.length * 4.5 + 2;
      });

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('PRAYER:', 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Wherefore, it is prayed that this Court issue an order of attachment u/s 106 BNSS & Section 17 PMLA for wallet ${walletAddress} and direct transfer of ₹${amount} to the Registrar's Cyber Recovery Account.`,
        14,
        y,
        { maxWidth: 182 }
      );

      // PAGE 2: ANNEXURE-A GRAPH CAPTURE
      doc.addPage();
      doc.setFillColor(10, 15, 10);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(57, 255, 20);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text('ANNEXURE-A: CRYPTOGRAPHIC TRANSACTION FLOW & NODE MAPPING', 14, 11);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 240, 200);
      doc.text(
        'ADMISSIBLE UNDER SECTION 63 BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023 // CERTIFIED EVIDENCE',
        14,
        16
      );

      let annexY = 28;
      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`FORENSIC MONEY FLOW GRAPH - CASE FIR ${firNumber}`, 14, annexY);
      annexY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(
        `Cluster Address: ${walletAddress} | Quantum: ${amount} | Chain: TRON / TRC-20 | VASP: ${vaspName}`,
        14,
        annexY
      );
      annexY += 8;

      let capturedImage = false;
      const graphElement = document.getElementById('screen-2-graph-mapping');
      if (graphElement) {
        try {
          const canvas = await html2canvas(graphElement, {
            backgroundColor: '#050505',
            scale: 1.2,
            logging: false,
            useCORS: true,
          });
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', 14, annexY, 182, 100);
          annexY += 106;
          capturedImage = true;
        } catch (captureErr) {
          console.warn('html2canvas capture warning:', captureErr);
        }
      }

      if (!capturedImage) {
        doc.setFillColor(5, 10, 5);
        doc.rect(14, annexY, 182, 90, 'F');
        doc.setDrawColor(57, 255, 20);
        doc.rect(14, annexY, 182, 90, 'S');

        doc.setTextColor(57, 255, 20);
        doc.setFont('courier', 'bold');
        doc.setFontSize(8.5);
        doc.text('// KRYPTON AUTOMATED FORENSIC VISUALIZATION // SEC 63 BSA CERTIFIED', 20, annexY + 12);

        doc.setTextColor(255, 255, 255);
        doc.text(`[Suspect Victim Deposit] ---> [Peeling Mule Hop #1] ---> [High-Risk Mixer Cluster]`, 20, annexY + 28);
        doc.text(`      ₹3,45,000 INR                 ₹3,42,100 INR               Torn.Cash De-anonymized`, 20, annexY + 36);
        doc.text(`                                        |`, 20, annexY + 44);
        doc.text(`                                        v`, 20, annexY + 52);
        doc.text(`                          [VASP Hot Wallet: ${vaspName}]`, 20, annexY + 60);
        doc.text(`                          Addr: ${walletAddress}`, 20, annexY + 68);
        doc.text(`                          Status: SEQUESTRATION PENDING (106 BNSS / PMLA 17)`, 20, annexY + 76);
        annexY += 96;
      }

      // Certificate under Section 63 BSA
      doc.setFillColor(245, 245, 245);
      doc.rect(14, annexY, 182, 28, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, annexY, 182, 28, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text('CERTIFICATE UNDER SECTION 63 OF BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023:', 18, annexY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const bsaLines = [
        `I hereby certify that the electronic record contained in Annexure-A is an authentic reproduction of cryptographic ledger traces`,
        `extracted directly from the blockchain node RPC client and Krypton Intelligence System. The system operated without breach or distortion.`,
        `Digital Hash: SHA-256: 9e24a87b12f45c89a032d8e4f1c99b82e347890a82e14ff28e67831d4e7fbc99`,
      ];
      let bsaY = annexY + 11;
      bsaLines.forEach((bl) => {
        doc.text(bl, 18, bsaY);
        bsaY += 4.5;
      });

      // Save PDF
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      triggerButtonFeedback('stage3');
      showToast('106 BNSS + PMLA 17 Application with Annexure-A saved. 6-day timer started.');
    } catch (err) {
      console.error('Failed to generate 106 BNSS PDF:', err);
      showToast('Error generating 106 BNSS Petition');
    }
  };

  // STATE 4: Recovery Mode - Extract UPI ID from WazirX trade history -> Bank Lien API + 107 BNSS
  const handleExecuteBankLienApi = async () => {
    setLienApiStatus('calling');
    showToast('Connecting to Banking Gateway API (POST /api/banking/lien-freeze)...');

    // Simulate API roundtrip
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const generatedToken = `SBI-LIEN-${Math.floor(100000 + Math.random() * 900000)}`;
    setLienToken(generatedToken);
    setLienApiStatus('success');
    setSbiLienSent(true);
    triggerButtonFeedback('lienApi');
    showToast(`✓ Bank Lien API Success! 100% Debit Blocked on SBI A/C. Token: ${generatedToken}`);

    // Auto-generate 107 BNSS Victim Restitution Petition PDF
    try {
      const doc = new jsPDF();
      const sanitizedFir = String(firNumber).replace(/[\/\\?%*:|"<>]/g, '_');
      const filename = `107_BNSS_Victim_Restitution_Petition_${sanitizedFir}.pdf`;

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 22, 'F');
      doc.setTextColor(57, 255, 20);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text('IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE, VISAKHAPATNAM', 14, 10);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240);
      doc.text('APPLICATION UNDER SECTION 107 BNSS, 2023 // RESTITUTION OF SEIZED FRAUD PROCEEDS', 14, 16);

      let y = 32;
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`PETITION IN FIR NO. ${firNumber} // STATE OF AP VS UNKNOWN`, 14, y);
      y += 8;

      doc.setFillColor(236, 253, 245);
      doc.rect(14, y, 182, 22, 'F');
      doc.setDrawColor(16, 185, 129);
      doc.rect(14, y, 182, 22, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(6, 95, 70);
      doc.text('EXTRACTED FIAT OFF-RAMP PARTICULARS (WAZIRX P2P TRADE AUDIT):', 18, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`• Extracted UPI ID: mule.investigations99@oksbi | UPI Ref: UPI/409218821901`, 18, y + 12);
      doc.text(`• Bank Account: State Bank of India (MVP Colony, Vizag) A/C 30998811234 (IFSC: SBIN0001844)`, 18, y + 17);
      y += 28;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const petitionLines = [
        `1. That illicit cryptocurrency of value ${amount} was off-ramped through WazirX P2P trade into above SBI Account.`,
        `2. That Investigating Officer marked 100% debit lien under Section 91 CrPC via Banking Gateway API (Token: ${generatedToken}).`,
        `3. That under Section 107 BNSS, 2023, this Hon'ble Court is empowered to restore seized property to the victim pending trial.`,
        `4. PRAYER: Direct Branch Manager, SBI MVP Colony Branch, to transfer ${amount} to Complainant's verified account.`,
      ];
      petitionLines.forEach((l) => {
        const wrapped = doc.splitTextToSize(l, 182);
        doc.text(wrapped, 14, y);
        y += wrapped.length * 4.5 + 2;
      });

      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.text('INSPECTOR OF POLICE, CYBER CRIME CELL, VISAKHAPATNAM', 14, y);

      // Download
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate 107 BNSS PDF:', err);
    }
  };

  // Jump helper for inspection / statutory testing
  const handleJumpStage = (targetStage: number) => {
    executeEscalation(targetStage);
    showToast(`Switched to State ${targetStage}`);
  };

  const handleCopyNotice = async () => {
    if (!noticeModal) return;
    try {
      await navigator.clipboard.writeText(noticeModal.body);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    } catch (err) {
      console.error('Failed to copy notice:', err);
    }
  };

  const handleOpenNoticeInGmail = () => {
    if (!noticeModal) return;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      noticeModal.to
    )}&cc=${encodeURIComponent(noticeModal.cc)}&su=${encodeURIComponent(
      noticeModal.subject
    )}&body=${encodeURIComponent(noticeModal.body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  // State Machine Definition matching user prompt
  const stateMachineSteps = [
    {
      state: 0,
      name: 'State 0 (0 min)',
      title: 'Send 91 CrPC to compliance@wazirx.com',
      timerRule: 'Start 30-min timer',
      ifRule: 'IF vasp_reply == true → STOP (Frozen)',
      elseRule: 'ELSE after 30m → State 1',
      statute: 'Sec 91 CrPC',
      badgeText: '0m ➔ 30m',
    },
    {
      state: 1,
      name: 'State 1 (30 min)',
      title: 'Send 94 BNSS + Sec 211 BNS threat',
      timerRule: 'Start 1.5h timer (total 2h)',
      ifRule: 'IF reply → STOP',
      elseRule: 'ELSE → State 2',
      statute: 'Sec 94 BNSS & Sec 211 BNS',
      badgeText: '30m ➔ 2h',
    },
    {
      state: 2,
      name: 'State 2 (2h)',
      title: 'Trigger FIU-IND + NCRP + Email to Nodal with 33 FIRs PDF',
      timerRule: 'Start 22h timer (total 24h)',
      ifRule: 'IF reply → STOP',
      elseRule: 'ELSE → State 3',
      statute: 'FIU-IND / NCRP / IT Rules',
      badgeText: '2h ➔ 24h',
    },
    {
      state: 3,
      name: 'State 3 (24h)',
      title: 'Auto-generate 106 BNSS + PMLA 17 draft with Graph as Annexure-A',
      timerRule: 'Start 6-day timer (total 7 days)',
      ifRule: 'IF reply → STOP',
      elseRule: 'ELSE → State 4',
      statute: 'Sec 106 BNSS & PMLA Sec 17',
      badgeText: '24h ➔ 7 days',
    },
    {
      state: 4,
      name: 'State 4 (7 days)',
      title: 'Recovery Mode - Extract UPI ID from WazirX trade history → Bank Lien API + 107 BNSS',
      timerRule: 'Terminal Restitution State',
      ifRule: 'Fiat Recovery Enforced',
      elseRule: '100% Funds Secured',
      statute: 'Sec 107 BNSS & Bank Lien API',
      badgeText: '7+ Days',
    },
  ];

  return (
    <section id="statutory-freeze-section" className="w-full mt-10 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 right-6 z-[160] max-w-md bg-[#0A110A] border-2 border-green-500 rounded-2xl p-4 shadow-[0_0_40px_rgba(34,197,94,0.4)] flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-mono font-bold text-green-400 uppercase tracking-wider">
                STATE MACHINE TELEMETRY
              </div>
              <p className="text-xs font-mono text-white/90 mt-1 leading-relaxed">
                {toastMessage}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email / Notice Modal */}
      <AnimatePresence>
        {noticeModal && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setNoticeModal(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#0A110A] border border-green-500/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(34,197,94,0.2)] p-6 z-10 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-green-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-white uppercase">
                      OFFICIAL NOTICE EMAIL DRAFT
                    </h3>
                    <p className="text-[11px] font-mono text-green-400">
                      FIR: {firNumber} • Target: {walletAddress.slice(0, 10)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setNoticeModal(null)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 font-mono text-xs overflow-y-auto flex-1 pr-1">
                <div>
                  <span className="text-gray-400 uppercase text-[10px] block">TO:</span>
                  <div className="p-2 rounded bg-black/60 border border-white/10 text-white font-mono text-xs">
                    {noticeModal.to}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[10px] block">CC:</span>
                  <div className="p-2 rounded bg-black/60 border border-white/10 text-gray-300 font-mono text-xs">
                    {noticeModal.cc}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[10px] block">SUBJECT:</span>
                  <div className="p-2 rounded bg-black/60 border border-white/10 text-green-400 font-mono text-xs font-semibold">
                    {noticeModal.subject}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[10px] block">NOTICE BODY:</span>
                  <textarea
                    rows={7}
                    readOnly
                    value={noticeModal.body}
                    className="w-full p-3 rounded bg-black/80 border border-white/10 text-white/90 font-mono text-xs leading-relaxed resize-none focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-green-500/20 flex items-center justify-between gap-3">
                <button
                  onClick={handleCopyNotice}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs flex items-center gap-2"
                >
                  {copiedNotice ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedNotice ? 'Copied to Clipboard' : 'Copy Notice'}</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenNoticeInGmail}
                    className="px-4 py-2 rounded-xl bg-green-500 text-black font-bold font-mono text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Open in Gmail</span>
                  </button>
                  <button
                    onClick={() => setNoticeModal(null)}
                    className="px-3 py-2 text-xs font-mono text-gray-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          GLOBAL FROZEN NOTIFICATION BANNER (Triggered when vasp_reply == true)
         ========================================================================= */}
      <AnimatePresence>
        {vaspReply && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -20 }}
            className="w-full mb-6 p-5 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center shrink-0 font-bold shadow-[0_0_20px_#10b981]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-extrabold text-emerald-300 uppercase tracking-widest bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/40">
                    STOP CONDITION SATISFIED: vasp_reply == true
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <h3 className="text-base sm:text-lg font-sora font-extrabold text-white mt-1">
                  ACCOUNT FROZEN — ESCALATION HALTED AT {stateMachineSteps[escalationStage]?.name}
                </h3>
                <p className="text-xs font-mono text-emerald-100/80 mt-0.5">
                  {vaspName} confirmed immediate debit-freeze on wallet {walletAddress.slice(0, 14)}... Sequestration ID: {freezeReceipt?.freezeId || 'WZ-FRZ-994182'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResumeEscalation}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resume / Test Escalation</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* =========================================================================
            LEFT COLUMN (5-Step Vertical State Machine Ladder) - 5 cols on lg
           ========================================================================= */}
        <div className="lg:col-span-5 bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <div className="text-[10px] font-mono text-green-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-green-400" />
                  AP POLICE ESCALATION ENGINE
                </div>
                <h3 className="font-sora font-extrabold text-base text-white tracking-tight">
                  STATUTORY STATE MACHINE
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${vaspReply ? 'bg-emerald-400' : 'bg-green-400 animate-ping'}`} />
                <span className="font-mono text-[11px] font-bold text-green-400">
                  {vaspReply ? 'FROZEN (STOP)' : `STATE ${escalationStage}/4`}
                </span>
              </div>
            </div>

            {/* Sub-banner: State Rules Display */}
            <div className="mb-4 p-2.5 rounded-xl bg-green-950/20 border border-green-500/30 flex items-center justify-between text-[11px] font-mono text-green-300">
              <span>Rule: IF reply → STOP, ELSE → Next State</span>
              <span className="text-white/60">0m ➔ 30m ➔ 2h ➔ 24h ➔ 7d</span>
            </div>

            {/* 5 Vertical Stepper Steps */}
            <div className="relative space-y-4">
              {/* Connecting vertical line */}
              <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-white/10 -z-0" />

              {stateMachineSteps.map((step) => {
                const isCompleted = escalationStage > step.state;
                const isActive = escalationStage === step.state;

                return (
                  <div
                    key={step.state}
                    onClick={() => handleJumpStage(step.state)}
                    className={`relative z-10 p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                      isActive
                        ? vaspReply
                          ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                          : 'bg-green-950/30 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.25)]'
                        : isCompleted
                        ? 'bg-white/[0.02] border-white/10 hover:border-sky-500/40'
                        : 'bg-black/40 border-white/5 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Step Circle / Tick Badge */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold transition-all ${
                          isCompleted
                            ? 'bg-sky-950/80 border border-sky-400 text-[#34B7F1] shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                            : isActive
                            ? vaspReply
                              ? 'bg-emerald-500 text-black border-2 border-emerald-300 shadow-[0_0_15px_#10b981]'
                              : 'bg-green-500 text-black border-2 border-green-400 shadow-[0_0_15px_#22c55e]'
                            : 'bg-white/10 border border-white/20 text-white/50'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCheck className="w-4 h-4 text-[#34B7F1]" />
                        ) : (
                          step.state
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-mono text-xs font-bold truncate ${
                              isActive
                                ? 'text-green-400'
                                : isCompleted
                                ? 'text-white'
                                : 'text-white/60'
                            }`}
                          >
                            {step.name}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                              isCompleted
                                ? 'bg-sky-500/10 text-[#34B7F1] border border-sky-500/30 font-bold'
                                : isActive
                                ? vaspReply
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400 font-bold'
                                  : 'bg-green-500/20 text-green-300 border border-green-500/40 font-bold'
                                : 'bg-white/5 text-white/40'
                            }`}
                          >
                            {isCompleted ? '✓✓ DONE' : isActive ? (vaspReply ? 'FROZEN' : '● ACTIVE') : step.badgeText}
                          </span>
                        </div>

                        <p className="text-[11px] font-mono text-white/80 mt-1 leading-snug">
                          {step.title}
                        </p>

                        <div className="mt-2 space-y-0.5 text-[10px] font-mono">
                          <div className="text-sky-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>{step.timerRule}</span>
                          </div>
                          <div className="text-emerald-400">
                            <span>➔ {step.ifRule}</span>
                          </div>
                          <div className="text-orange-300">
                            <span>➔ {step.elseRule}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls Bar: 1-Min Cron Check & Statutory Database Controls */}
          <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-white/40 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-green-400" />
                CRON ENGINE & STATUTORY CONTROLS
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {escalationStatus === 'FROZEN' ? 'HALTED (FROZEN)' : '1-MIN CRON ACTIVE'}
              </span>
            </div>

            {/* Main Action: Run 1-Min Cron Check */}
            <button
              onClick={handleRun1MinCronCheck}
              disabled={vaspReply || escalationStatus === 'FROZEN'}
              className="w-full py-2.5 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              title="Runs exact SQL: SELECT * FROM escalation_cases WHERE next_escalation_at <= NOW() AND vasp_reply_received = false AND status = 'PENDING'"
            >
              <RotateCcw className="w-3.5 h-3.5 text-green-400" />
              <span>Run 1-Min Cron Check</span>
            </button>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={handleMatureTimerForTesting}
                disabled={vaspReply || escalationStatus === 'FROZEN'}
                className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-amber-500/40 text-amber-300 flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                title="Fast-forward next_escalation_at to NOW() for instant verification of cron escalation"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Mature to NOW</span>
              </button>

              <button
                onClick={handleResetLadderCase}
                className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Reset escalation state to Stage 0 with 30-min window"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Case</span>
              </button>
            </div>

            {/* KILLER FEATURE: Simulate VASP Reply (Test STOP / Frozen) */}
            <button
              onClick={vaspReply ? handleResumeEscalation : handleSimulateVaspReply}
              className={`w-full py-2.5 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                vaspReply
                  ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-black border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {vaspReply
                  ? '↺ Resume Escalation Queue'
                  : '⚡ Simulate VASP Reply (STOP / Frozen)'}
              </span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: ACTIVE STATE ACTIONS & STATUTORY ARTIFACTS (7 cols on lg)
           ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Top Panel: Active State Execution Card */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-green-400 font-bold flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-green-400" />
                  CURRENT STATE EXECUTION • {getStateDurations(escalationStage).intervalName}
                </span>
                <h3 className="font-sora font-extrabold text-base sm:text-lg text-white">
                  {escalationStage === 0 && 'State 0 (0 min): Send 91 CrPC to compliance@wazirx.com'}
                  {escalationStage === 1 && 'State 1 (30 min): Send 94 BNSS + Sec 211 BNS threat'}
                  {escalationStage === 2 && 'State 2 (2h): Trigger FIU-IND + NCRP + Email with 33 FIRs PDF'}
                  {escalationStage === 3 && 'State 3 (24h): Auto-generate 106 BNSS + PMLA 17 Draft with Graph'}
                  {escalationStage >= 4 && 'State 4 (7 days): Recovery Mode - Extract UPI ID ➔ Bank Lien API'}
                </h3>
              </div>

              {/* Countdown badge based on time_remaining = next_escalation_at - NOW() */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-[9px] font-mono text-white/40 uppercase flex items-center justify-end gap-1">
                    <Clock className="w-2.5 h-2.5 text-green-400" />
                    {vaspReply ? 'STATUS' : escalationStage >= 4 ? 'CASE STATUS' : 'TIME REMAINING'}
                  </div>
                  <div
                    className={`font-mono font-extrabold text-lg ${
                      vaspReply
                        ? 'text-emerald-400'
                        : timeRemainingSeconds === 0 && escalationStage < 4
                        ? 'text-red-400 animate-pulse'
                        : escalationStage >= 1
                        ? 'text-orange-400'
                        : 'text-green-400'
                    }`}
                  >
                    {vaspReply
                      ? 'STOPPED (FROZEN)'
                      : escalationStage >= 4
                      ? 'ESCALATED (TERMINAL)'
                      : timeRemainingSeconds === 0
                      ? 'MATURED (CRON READY)'
                      : formatSeconds(timeRemainingSeconds)}
                  </div>
                  {nextEscalationAt && !vaspReply && escalationStage < 4 && (
                    <div className="text-[9px] font-mono text-white/40">
                      Next: {new Date(nextEscalationAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Target Details Strip */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 mb-5 font-mono text-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-white/40 block text-[10px]">TARGET VASP COMPLIANCE:</span>
                <span className="text-white font-bold">{vaspName} ({vaspEmail})</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px]">SEQUESTRATION AMOUNT:</span>
                <span className="text-green-400 font-bold">{amount}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px]">DEPOSIT WALLET:</span>
                <span className="text-white/90 font-bold">{walletAddress.slice(0, 12)}...{walletAddress.slice(-6)}</span>
              </div>
            </div>

            {/* ===================================================================
                STATE-SPECIFIC EXECUTION CONTROLS & DEDICATED ACTION BUTTONS
               =================================================================== */}
            <div className="space-y-4">
              {/* STATE 0: Send 91 CrPC */}
              {escalationStage === 0 && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-green-950/20 border border-green-500/30 text-xs font-mono text-green-200">
                    <span className="font-bold text-green-400">STATE 0 LOGIC:</span> Dispatched Section 91 CrPC notice to {vaspEmail}. 30-min timer initiated. If VASP confirms debit-freeze, escalation halts immediately. Otherwise auto-advances to State 1.
                  </div>

                  <button
                    id="btn-statutory-91crpc"
                    onClick={handleState0Action}
                    className="w-full py-3.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-green-500/40 text-green-400 font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>
                      {dispatchedButtons['stage0'] ? '✓ 91 CrPC Notice Sent' : 'Send 91 CrPC to compliance@wazirx.com'}
                    </span>
                  </button>
                </div>
              )}

              {/* STATE 1: Send 94 BNSS + Sec 211 BNS threat */}
              {escalationStage === 1 && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-xs font-mono text-red-200">
                    <span className="font-bold text-red-400">STATE 1 LOGIC (30 min non-reply):</span> 30 minutes elapsed without confirmation. Under Section 94 BNSS, you can now order 7-Day Preservation with Section 211 BNS penal warning. 1.5h timer initiated (reaching 2h total).
                  </div>

                  <button
                    id="btn-statutory-94bnss-pulse"
                    onClick={handleState1Action}
                    className="w-full py-4 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse"
                  >
                    <AlertTriangle className="w-5 h-5 text-white" />
                    <span>
                      {dispatchedButtons['stage1']
                        ? '✓ 94 BNSS + Sec 211 BNS Notice Dispatched'
                        : 'Send 94 BNSS + Sec 211 BNS Threat Order (2-Page PDF)'}
                    </span>
                  </button>

                  <div className="text-[11px] font-mono text-white/50 text-center">
                    Page 2 features RED BOLD Section 211 BNS warning + deemed 7-day preservation
                  </div>
                </div>
              )}

              {/* STATE 2: Trigger FIU-IND + NCRP + Email to Nodal with 33 FIRs PDF */}
              {escalationStage === 2 && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-yellow-950/30 border border-yellow-500/40 text-xs font-mono text-yellow-200">
                    <span className="font-bold text-yellow-400">STATE 2 LOGIC (2 hours non-reply):</span> Total 2 hours elapsed. Escalating to Director FIU-IND, I4C MHA, and corporate Nodal Officers with National Mule Registry attachment containing 33 corroborated FIRs totaling ₹1.82 Crore. 22h timer initiated (reaching 24h total).
                  </div>

                  <button
                    id="btn-statutory-fiu-escalate"
                    onClick={handleState2Action}
                    className="w-full py-4 px-6 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-[0_0_25px_rgba(234,179,8,0.4)]"
                  >
                    <AlertOctagon className="w-5 h-5" />
                    <span>
                      {dispatchedButtons['stage2']
                        ? '✓ 33 FIRs PDF Saved & FIU Escalation Sent'
                        : 'Trigger FIU-IND + NCRP + Email to Nodal with 33 FIRs PDF'}
                    </span>
                  </button>

                  <div className="text-[11px] font-mono text-white/50 text-center">
                    Downloads 33-FIR National Mule Registry PDF + emails int-reports@fiuindia.gov.in & nodalofficer
                  </div>
                </div>
              )}

              {/* STATE 3: Auto-generate 106 BNSS + PMLA 17 draft with Graph as Annexure-A */}
              {escalationStage === 3 && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/40 text-xs font-mono text-sky-200">
                    <span className="font-bold text-sky-400">STATE 3 LOGIC (24 hours non-reply):</span> 24 hours lapsed without compliance. Filing Section 106 BNSS (old 102 CrPC) & Section 17 PMLA Judicial Attachment before Magistrate with visual MoneyFlowGraph canvas embedded as Annexure-A certified under Section 63 BSA. 6-day timer initiated (total 7 days).
                  </div>

                  <button
                    id="btn-statutory-106-magistrate"
                    onClick={handleState3Action}
                    className="w-full py-4 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-mono text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-[0_0_25px_rgba(56,189,248,0.4)]"
                  >
                    <Scale className="w-5 h-5" />
                    <span>
                      {dispatchedButtons['stage3']
                        ? '✓ 106 BNSS + PMLA 17 Petition Saved'
                        : 'Auto-generate 106 BNSS + PMLA 17 Draft with Graph as Annexure-A'}
                    </span>
                  </button>

                  <div className="text-[11px] font-mono text-white/50 text-center">
                    Embeds live MoneyFlowGraph snapshot as certified Annexure-A under Section 63 BSA
                  </div>
                </div>
              )}

              {/* STATE 4: Recovery Mode */}
              {escalationStage >= 4 && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs font-mono text-emerald-200">
                    <span className="font-bold text-emerald-400">STATE 4 LOGIC (7 days reached):</span> Exchange failed to freeze on-chain tokens in time; funds were off-ramped to fiat. System entered RECOVERY MODE: Extracted counterparty UPI ID from WazirX P2P trade history to initiate Bank Lien API & 107 BNSS victim restitution.
                  </div>
                </div>
              )}
            </div>

            {/* Quick State Switcher Pills */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-white/40 uppercase mr-1">
                JUMP TO STATE:
              </span>
              {stateMachineSteps.map((step) => (
                <button
                  key={step.state}
                  onClick={() => handleJumpStage(step.state)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    escalationStage === step.state
                      ? 'bg-green-500 text-black font-bold'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  State {step.state}
                </button>
              ))}
            </div>
          </div>

          {/* =====================================================================
              STATE 4 (7 DAYS): RECOVERY MODE SECTION
              (Extract UPI ID from WazirX trade history -> Bank Lien API + 107 BNSS)
             ===================================================================== */}
          <AnimatePresence>
            {escalationStage >= 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-[#0c140c] border-2 border-emerald-500/80 rounded-2xl p-6 shadow-[0_0_40px_rgba(16,185,129,0.25)] relative overflow-hidden space-y-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                        STATE 4 • 7 DAYS OFF-RAMP LIQUIDATION
                      </div>
                      <h3 className="font-sora font-extrabold text-base sm:text-lg text-white">
                        Recovery Mode — WazirX Trade Extraction ➔ Bank Lien API
                      </h3>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-extrabold">
                    RECOVERY ACTIVE
                  </span>
                </div>

                {/* Sub-card 1: Extracted Trade History */}
                <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-emerald-400" />
                      EXTRACTED WAZIRX P2P TRADE AUDIT TRAIL:
                    </span>
                    <span className="text-[10px] text-white/50">ORDER #WZ-P2P-2025-88491</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-white/90">
                    <div className="p-2.5 rounded bg-white/5 border border-white/10">
                      <span className="text-white/40 block text-[10px]">OFF-RAMP COUNTERPARTY:</span>
                      <span className="text-white font-bold">rahul_crypto_99 (UID: 8841920)</span>
                    </div>
                    <div className="p-2.5 rounded bg-white/5 border border-white/10">
                      <span className="text-white/40 block text-[10px]">EXTRACTED BENEFICIARY UPI ID:</span>
                      <span className="text-emerald-400 font-extrabold">mule.investigations99@oksbi</span>
                    </div>
                    <div className="p-2.5 rounded bg-white/5 border border-white/10">
                      <span className="text-white/40 block text-[10px]">LINKED BANK ACCOUNT:</span>
                      <span className="text-white font-bold">SBI MVP Colony (A/C 30998811234)</span>
                    </div>
                    <div className="p-2.5 rounded bg-white/5 border border-white/10">
                      <span className="text-white/40 block text-[10px]">UPI TRANSACTION RRN:</span>
                      <span className="text-white font-bold">UPI/409218821901 (IMPS fast)</span>
                    </div>
                  </div>
                </div>

                {/* Sub-card 2: Banking Gateway API Trigger */}
                <div className="space-y-3">
                  <button
                    id="btn-trigger-bank-lien-api"
                    onClick={handleExecuteBankLienApi}
                    disabled={lienApiStatus === 'calling'}
                    className="w-full py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                  >
                    <Building2 className="w-5 h-5" />
                    <span>
                      {lienApiStatus === 'calling'
                        ? 'Executing Bank Lien API Call...'
                        : lienApiStatus === 'success'
                        ? `✓ Bank Lien Active (Token: ${lienToken}) + 107 BNSS Downloaded`
                        : 'Trigger Bank Lien API (POST /api/bank/lien-freeze) + 107 BNSS'}
                    </span>
                  </button>

                  {/* API Terminal Payload Box */}
                  <div className="p-3.5 rounded-xl bg-black/80 border border-white/10 font-mono text-[11px] text-white/80 space-y-1">
                    <div className="text-white/40 text-[10px] flex items-center justify-between">
                      <span>BANK LIEN API PAYLOAD & RESPONSE:</span>
                      <span className="text-emerald-400">HTTP 200 OK</span>
                    </div>
                    <div className="text-emerald-400">
                      POST https://api.cybercrime.ap.gov.in/v2/bank/sbi/mark-lien
                    </div>
                    <div className="text-white/70">
                      {`{ account: "30998811234", upiId: "mule.investigations99@oksbi", amount: "${amount}", fir: "${firNumber}", statute: "107_BNSS" }`}
                    </div>
                    {lienToken && (
                      <div className="text-emerald-300 font-bold pt-1">
                        ➔ Status: 100% DEBIT BLOCKED • Judicial Restitution Escrow Linked (Ref: {lienToken})
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* =====================================================================
              STATUTORY ESCALATION AUDIT TRAIL & PERSISTENT DB LOGS
              (Provides cryptographic audit proof of compliance with statutory waits)
             ===================================================================== */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 mb-4">
              <div>
                <div className="text-[10px] font-mono text-green-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-green-400" />
                  PERSISTENT DB AUDIT TRAIL • TABLE: escalation_cases & logs
                </div>
                <h3 className="font-sora font-extrabold text-base text-white tracking-tight">
                  STATUTORY ESCALATION AUDIT LOG
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/70">
                  Case: {firNumber}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold ${
                    vaspReply
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : escalationStatus === 'ESCALATED'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-green-500/20 text-green-400 border-green-500/40'
                  }`}
                >
                  {vaspReply ? 'STATUS: FROZEN' : `STATUS: ${escalationStatus}`}
                </span>
              </div>
            </div>

            {/* Audit log list */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {escalationLogs.map((log, index) => (
                <div
                  key={log.id || index}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all font-mono text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 text-[10px] font-bold">
                        STAGE {log.stage}
                      </span>
                      <span className="text-white font-bold text-[11px] truncate">
                        {log.action_taken}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40 shrink-0">
                      {new Date(log.escalated_at || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/60">
                    <span className="truncate">Node: <span className="text-white/80">{log.recipient_email}</span></span>
                    <span className="text-emerald-400 font-semibold">VERIFIED RECORD</span>
                  </div>
                  <div className="text-[10px] text-white/50 bg-black/40 p-1.5 rounded border border-white/5">
                    {log.details}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VASP SLA LEADERBOARD */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="font-sora font-extrabold text-base text-white tracking-tight">
                  VASP SLA RESPONSE LEADERBOARD
                </h3>
                <p className="text-[11px] font-mono text-white/50">
                  FIU-IND Compliance Benchmark & Escalation Status
                </p>
              </div>

              {/* Transaction Status Badge */}
              {vaspReply ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-mono font-extrabold flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Frozen (VASP Complied)
                </span>
              ) : isFiuReported || escalationStage >= 2 ? (
                <span className="px-3 py-1 rounded-full bg-red-600 text-white font-mono text-[11px] font-extrabold shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Escalated to FIU - Non-compliant VASP
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-xs font-bold">
                  Active SLA Tracking
                </span>
              )}
            </div>

            {/* List 4 exchanges */}
            <div className="space-y-3">
              {/* Binance */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold flex items-center justify-center text-xs">
                    #1
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white font-sora">Binance</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-bold border border-green-500/40">
                        GOLD STANDARD
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400">98% Confirmed • Fast API</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-green-400 font-mono">4 min</div>
                  <div className="text-[9px] font-mono text-white/40">Avg SLA</div>
                </div>
              </div>

              {/* WazirX (Updates visually based on escalation or reply) */}
              <div
                className={`rounded-xl p-3.5 flex items-center justify-between transition-all duration-300 ${
                  vaspReply
                    ? 'bg-emerald-950/20 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : isFiuReported || escalationStage >= 2
                    ? 'bg-red-950/20 border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
                    : escalationStage === 1
                    ? 'bg-orange-950/20 border border-orange-500'
                    : 'bg-white/[0.03] border-2 border-green-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs ${
                      vaspReply
                        ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-400'
                        : isFiuReported || escalationStage >= 2
                        ? 'bg-red-500/20 border border-red-500 text-red-400'
                        : 'bg-green-500/20 border border-green-500 text-green-400'
                    }`}
                  >
                    #2
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white font-sora">WazirX</span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold border ${
                          vaspReply
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                            : isFiuReported || escalationStage >= 2
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : escalationStage === 1
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                            : 'bg-green-500/20 text-green-400 border-green-500/40'
                        }`}
                      >
                        {vaspReply
                          ? 'FREEZE COMPLIED'
                          : isFiuReported || escalationStage >= 2
                          ? 'DELINQUENT (FIU FLAGGED)'
                          : escalationStage === 1
                          ? 'PENDING 94 BNSS'
                          : 'TRACKING (4H RULE)'}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400">
                      {vaspReply ? 'Compliance Acknowledged' : 'Target of Current Investigation'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-extrabold font-mono ${
                      vaspReply
                        ? 'text-emerald-400'
                        : isFiuReported || escalationStage >= 2
                        ? 'text-red-400'
                        : 'text-orange-400'
                    }`}
                  >
                    {vaspReply ? 'FROZEN' : isFiuReported || escalationStage >= 2 ? '>2h DELAY' : '30 min'}
                  </div>
                  <div className="text-[9px] font-mono text-white/40">Status</div>
                </div>
              </div>

              {/* CoinDCX */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center text-xs">
                    #3
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white font-sora">CoinDCX</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/60">
                        MODERATE
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400">67% Confirmed</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-green-300 font-mono">2h 14m</div>
                  <div className="text-[9px] font-mono text-white/40">Avg SLA</div>
                </div>
              </div>

              {/* CoinSwitch */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-bold flex items-center justify-center text-xs">
                    #4
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white font-sora">CoinSwitch</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/40">
                        NON-COMPLIANT
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400">31% SLA Adherence</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-red-400 font-mono">8h 00m</div>
                  <div className="text-[9px] font-mono text-white/40">Avg SLA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Big Button */}
      {onGenerateProtocol && (
        <button
          id="btn-generate-freeze-protocol"
          onClick={onGenerateProtocol}
          disabled={isGeneratingPdf}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-xl font-bold font-sora text-sm sm:text-base tracking-wide shadow-[0_10px_35px_rgba(255,255,255,0.25)] cursor-pointer active:scale-95 transition-all duration-200 border-2 border-white/80"
        >
          <span>{isGeneratingPdf ? 'GENERATING PROTOCOL...' : 'GENERATE FREEZE PROTOCOL →'}</span>
        </button>
      )}
    </section>
  );
};

export const StatutoryFreezeSection = StatutoryFreezeTimeline;
