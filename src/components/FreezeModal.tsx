import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaseData } from '../types';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  Mail,
  AlertOctagon,
} from 'lucide-react';

interface FreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CaseData;
  downloadedFilename?: string;
}

export const FreezeModal: React.FC<FreezeModalProps> = ({
  isOpen,
  onClose,
  caseData,
  downloadedFilename,
}) => {
  const [copied, setCopied] = useState(false);

  const defaultTo = `${caseData.vasp.complianceEmail}, ${caseData.vasp.nodalEmail}`;
  const defaultCc = caseData.vasp.ccEmail;
  const defaultSubject = `URGENT Freeze Request 91 CrPC - FIR ${caseData.firNumber} - Wallet ${caseData.vasp.hotWallet}`;

  const defaultBody = `To: Grievance Officer & Head of Regulatory Compliance, ${caseData.vasp.name}
Cc: Nodal Officer (${caseData.vasp.nodalEmail}) & I4C - MHA // NCRB National Cybercrime Cell
(${caseData.vasp.ccEmail})

SUBJECT: STATUTORY NOTICE UNDER SECTION 91 OF CODE OF CRIMINAL PROCEDURE (CrPC) / SECTION 94 BNSS - IMMEDIATE DEBIT FREEZE & KYC REQUISITION

Respected Compliance Team,

1. This urgent communication is issued in relation to criminal proceedings registered under FIR No. ${caseData.firNumber} at Cyber Crime PS [State], National Cybercrime Reporting Portal (NCRP) / I4C MHA.

2. On-chain forensic tracing conducted via KRYPTON Engine has mapped an active money-laundering trail originating from victim theft/fraud proceeds. The trail reveals that illicit digital assets amounting to ${caseData.rawAmount} (${caseData.amountFormatted}) were transferred through layering hops directly into your Exchange Hot Wallet / Internal Deposit Cluster:
   - Target Wallet: ${caseData.vasp.fullHotWallet}
   - Chain / Protocol: ${caseData.chain}
   - Terminus Transaction Hash: ${caseData.txHash}
   - Forensic Hop Distance: ${caseData.vasp.hopsText} (${caseData.vasp.confidence}% Verified Trace)

3. Under powers conferred by Section 91 of the Code of Criminal Procedure, 1973 (and Section 94 of BNSS, 2023), you are hereby DIRECTED to:
   a) Immediately impose an administrative and debit-freeze on the recipient account/UID, preventing any further off-ramping, P2P transfer, or crypto withdrawals.
   b) Preserve all relevant server logs, IP addresses, session data, and cryptographic key hashes.
   c) Furnish within 24 hours the full KYC dossier (Government Photo ID, PAN, Aadhaar, verified phone number, registered email, and linked fiat INR bank accounts) of the beneficiary account holder.

4. Non-compliance with this statutory requisition will invite penal proceedings under relevant sections of law including Section 175/176 of IPC / BNS.

Official forensic report attached: ${downloadedFilename || `KRYPTON_FIR_${caseData.firNumber.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`}

Regards,
Inspector of Police,
Cyber Crime PS [State],
National Cybercrime Reporting Portal // I4C - MHA,
Government of India
Email: ${caseData.vasp.ccEmail}`;

  const [toField, setToField] = useState(defaultTo);
  const [ccField, setCcField] = useState(defaultCc);
  const [subjectField, setSubjectField] = useState(defaultSubject);
  const [bodyField, setBodyField] = useState(defaultBody);

  React.useEffect(() => {
    setToField(defaultTo);
    setCcField(defaultCc);
    setSubjectField(defaultSubject);
    setBodyField(defaultBody);
  }, [defaultTo, defaultCc, defaultSubject, defaultBody]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bodyField);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      toField
    )}&cc=${encodeURIComponent(ccField)}&su=${encodeURIComponent(
      subjectField
    )}&body=${encodeURIComponent(bodyField)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Sheet / Dialog */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-2xl bg-[#0A110A]/95 border border-[#39FF14]/30 rounded-t-2xl sm:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(57,255,20,0.15)] backdrop-blur-2xl flex flex-col max-h-[90vh] overflow-hidden z-10"
        >
          {/* Top subtle highlight */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#39FF14]/50 to-transparent" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-[#39FF14]/15 flex items-center justify-between bg-[#050805]/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#39FF14]/15 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] shadow-[0_0_12px_rgba(57,255,20,0.25)]">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-mono text-sm sm:text-base font-bold text-white uppercase tracking-tight">
                    FREEZE REQUEST PROTOCOL - SECTION 91 CrPC / 94 BNSS
                  </h2>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14] font-mono text-[9px] font-bold">
                    PRIORITY-1
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#8BA88B] mt-0.5">
                  Automated Law Enforcement Directive for {caseData.vasp.name} Compliance Desk
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8BA88B] hover:text-white hover:bg-[#39FF14]/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* PDF Download Success Banner */}
          <div className="px-4 py-2.5 bg-[#39FF14]/10 border-b border-[#39FF14]/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#39FF14]">
              <FileCheck2 className="w-4 h-4 shrink-0" />
              <span>
                PDF Attached:{' '}
                <strong className="underline text-white">
                  {downloadedFilename || `KRYPTON_FIR_${caseData.firNumber.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`}
                </strong>
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8BA88B] font-semibold">READY TO DISPATCH</span>
          </div>

          {/* Form Fields */}
          <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1 font-mono text-xs">
            {/* To */}
            <div>
              <label className="block text-[10px] font-semibold text-[#8BA88B] mb-1 uppercase tracking-wider">
                RECIPIENT (TO):
              </label>
              <input
                type="text"
                value={toField}
                onChange={(e) => setToField(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#050805] border border-[#39FF14]/20 text-[#F0FFF0] font-mono text-xs focus:outline-none focus:border-[#39FF14]/60 transition-colors"
              />
            </div>

            {/* CC */}
            <div>
              <label className="block text-[10px] font-semibold text-[#8BA88B] mb-1 uppercase tracking-wider">
                OFFICIAL RECORD (CC):
              </label>
              <input
                type="text"
                value={ccField}
                onChange={(e) => setCcField(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#050805] border border-[#39FF14]/20 text-[#F0FFF0] font-mono text-xs focus:outline-none focus:border-[#39FF14]/60 transition-colors"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[10px] font-semibold text-[#8BA88B] mb-1 uppercase tracking-wider">
                SUBJECT LINE:
              </label>
              <input
                type="text"
                value={subjectField}
                onChange={(e) => setSubjectField(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#050805] border border-[#39FF14]/20 text-[#F0FFF0] font-mono text-xs focus:outline-none focus:border-[#39FF14]/60 transition-colors"
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold text-[#8BA88B] uppercase tracking-wider">
                  STATUTORY NOTICE TEXT (SECTION 91 CrPC):
                </label>
                <span className="text-[9px] text-[#8BA88B]/60">Auto-filled with FIR & Hash Trail</span>
              </div>
              <textarea
                rows={8}
                value={bodyField}
                onChange={(e) => setBodyField(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#050805] border border-[#39FF14]/20 text-[#F0FFF0]/90 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-[#39FF14]/60 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Modal Footer / Actions */}
          <div className="p-4 sm:p-5 border-t border-[#39FF14]/15 bg-[#050805]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-[#8BA88B] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#39FF14]" />
              <span>Official I4C / NCRB Law Enforcement Dispatch</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopy}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#0A110A] hover:bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#F0FFF0] font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#39FF14]" />
                    <span className="text-[#39FF14]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#8BA88B]" />
                    <span>Copy Body</span>
                  </>
                )}
              </button>

              <button
                onClick={handleOpenGmail}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#39FF14] text-black hover:bg-[#7FFF67] font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all active:scale-95 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Open in Gmail</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </button>

              <button
                onClick={onClose}
                className="px-3.5 py-2.5 rounded-xl text-[#8BA88B] hover:text-white text-xs font-mono transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
