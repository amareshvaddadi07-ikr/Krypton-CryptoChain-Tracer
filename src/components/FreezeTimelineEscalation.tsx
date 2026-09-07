import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  AlertOctagon,
  ShieldCheck,
  FileDown,
  Mail,
  Scale,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { CaseData, VaspDetail } from '../types';

interface FreezeTimelineEscalationProps {
  caseData: CaseData;
  onGenerateProtocol: (type: '91CrPC' | '94BNSS' | '106BNSS') => void;
  onOpenEmailModal: () => void;
}

export const FreezeTimelineEscalation: React.FC<FreezeTimelineEscalationProps> = ({
  caseData,
  onGenerateProtocol,
  onOpenEmailModal,
}) => {
  // Countdown timer: 04:23:15
  const [secondsRemaining, setSecondsRemaining] = useState<number>(4 * 3600 + 23 * 60 + 15);
  const [escalated94, setEscalated94] = useState(false);
  const [escalatedFiu, setEscalatedFiu] = useState(false);
  const [escalated106, setEscalated106] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const leaderboard = [
    {
      name: 'Binance',
      sla: '4 min',
      compliance: '98%',
      status: 'Fast & Green',
      color: 'text-[#D4FF32]',
      bgColor: 'bg-[#D4FF32]/10',
      borderColor: 'border-[#D4FF32]/20',
      badge: 'GOLD STANDARD',
    },
    {
      name: 'WazirX',
      sla: '47 min',
      compliance: '82%',
      status: 'Standard Processing',
      color: 'text-[#EAB308]',
      bgColor: 'bg-[#EAB308]/10',
      borderColor: 'border-[#EAB308]/20',
      badge: 'MODERATE',
    },
    {
      name: 'CoinDCX',
      sla: '2h 14m',
      compliance: '67%',
      status: 'Delayed Verification',
      color: 'text-[#39FF14]',
      bgColor: 'bg-[#39FF14]/10',
      borderColor: 'border-[#39FF14]/20',
      badge: 'SLOW',
    },
    {
      name: 'CoinSwitch',
      sla: '8h 00m',
      compliance: '31%',
      status: 'FIU Notice Recommended',
      color: 'text-[#FF2A2A]',
      bgColor: 'bg-[#FF2A2A]/10',
      borderColor: 'border-[#FF2A2A]/20',
      badge: 'NON-COMPLIANT',
    },
  ];

  const handleEscalate94 = () => {
    setEscalated94(true);
    onGenerateProtocol('94BNSS');
  };

  const handleEscalateFiu = () => {
    setEscalatedFiu(true);
    const subject = encodeURIComponent(
      `ESCALATION: Non-Responsive VASP Freeze - FIR ${caseData.firNumber} - ${caseData.vasp.name}`
    );
    const body = encodeURIComponent(
      `To: FIU-IND (int-reports@fiuindia.gov.in, fiu@fiuindia.gov.in)\n` +
      `Cc: Grievance Officer, ${caseData.vasp.name} (${caseData.vasp.complianceEmail}, ${caseData.vasp.nodalEmail})\n` +
      `From: Cyber Crime PS [State], National Cybercrime Reporting Portal // I4C MHA\n\n` +
      `Subject: URGENT ESCALATION UNDER PMLA / FIU-IND MANDATES - FIR ${caseData.firNumber}\n\n` +
      `This is to inform that a statutory freeze requisition under Section 91 CrPC / Section 94 BNSS was dispatched to ${caseData.vasp.name} for target wallet ${caseData.vasp.hotWallet} amounting to ${caseData.rawAmount}.\n` +
      `The statutory SLA of ${caseData.vasp.sla || '47 min'} has elapsed with no freeze confirmation. We request FIU-IND compliance intervention and regulatory notice.`
    );
    window.open(`mailto:int-reports@fiuindia.gov.in,fiu@fiuindia.gov.in?cc=${encodeURIComponent(caseData.vasp.nodalEmail)}&subject=${subject}&body=${body}`);
  };

  const handleEscalate106 = () => {
    setEscalated106(true);
    onGenerateProtocol('106BNSS');
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left Column: Freeze Status Timeline & Escalation Buttons (7 cols) */}
      <div className="lg:col-span-7 p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#39FF14]" />
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Statutory Freeze Timeline & Auto-Escalation
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14] font-mono text-[9px] font-bold">
              4-HOUR DEEMED RULE
            </span>
          </div>

          {/* Timeline Milestones */}
          <div className="py-3.5 space-y-3 font-mono text-xs">
            {/* Step 1: Initial Dispatch */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] shrink-0 mt-0.5 shadow-[0_0_8px_rgba(57,255,20,0.2)]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">10:30 AM — Preliminary Freeze Dispatch</span>
                  <span className="text-[10px] text-[#39FF14] font-semibold">DISPATCHED ✓</span>
                </div>
                <p className="text-[11px] text-white/50 mt-0.5">
                  Initial Requisition sent to {caseData.vasp.name} ({caseData.vasp.complianceEmail}) under Sec 91 CrPC.
                </p>
              </div>
            </div>

            {/* Step 2: Auto-Countdown Timer */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#39FF14]/10 via-[#39FF14]/5 to-transparent border border-[#39FF14]/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-[#39FF14] shrink-0 animate-pulse" />
                <div>
                  <div className="text-[10px] font-bold text-[#39FF14] uppercase">
                    Auto-Freeze Countdown (94 BNSS 7-Day Preservation):
                  </div>
                  <div className="text-[11px] text-white/70">
                    If exchange does not reply, system auto-converts to 7-Day Deemed Preservation.
                  </div>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-[#39FF14]/40 text-[#39FF14] font-bold text-sm tracking-widest shrink-0 shadow-[0_0_12px_rgba(57,255,20,0.3)]">
                {formatTimer(secondsRemaining)}
              </div>
            </div>
          </div>
        </div>

        {/* Escalation Action Buttons Row */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleEscalate94}
            className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 border ${
              escalated94
                ? 'bg-[#FF2A2A]/20 border-[#FF2A2A] text-[#FF2A2A]'
                : 'bg-white/5 hover:bg-[#FF2A2A] hover:text-white border-white/10 text-white/80 active:scale-95'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{escalated94 ? '✓ 94 BNSS ORDER ACTIVE' : 'Escalate to 94 BNSS Preservation'}</span>
          </button>

          <button
            onClick={handleEscalateFiu}
            className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 border ${
              escalatedFiu
                ? 'bg-[#A855F7]/20 border-[#A855F7] text-[#A855F7]'
                : 'bg-white/5 hover:bg-[#A855F7] hover:text-white border-white/10 text-white/80 active:scale-95'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{escalatedFiu ? '✓ FIU-IND NOTICE SENT' : 'Escalate to FIU-IND + Nodal'}</span>
          </button>

          <button
            onClick={handleEscalate106}
            className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 border ${
              escalated106
                ? 'bg-[#D4FF32]/20 border-[#D4FF32] text-[#D4FF32]'
                : 'bg-white/5 hover:bg-white hover:text-black border-white/10 text-white/80 active:scale-95'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{escalated106 ? '✓ 106 BNSS DRAFTED' : 'Magistrate Order Draft 106 BNSS'}</span>
          </button>
        </div>
      </div>

      {/* Right Column: VASP SLA Leaderboard (5 cols) */}
      <div className="lg:col-span-5 p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              VASP SLA Response Leaderboard
            </h3>
            <span className="text-[9px] font-mono text-white/40">FIU-IND COMPLIANCE BENCHMARK</span>
          </div>

          <div className="py-2.5 space-y-2">
            {leaderboard.map((item) => {
              const isCurrentVasp = item.name.toLowerCase() === caseData.vasp.name.toLowerCase();
              return (
                <div
                  key={item.name}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrentVasp
                      ? 'bg-white/10 border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.2)]'
                      : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-white">{item.name}</span>
                        {isCurrentVasp && (
                          <span className="px-1.5 py-0.2 rounded bg-[#39FF14] text-black text-[8px] font-bold font-mono">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-white/40">{item.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs text-right">
                    <div className="flex flex-col">
                      <span className={`font-bold ${item.color}`}>{item.sla}</span>
                      <span className="text-[9px] text-white/40">{item.compliance} Confirmed</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold border ${item.bgColor} ${item.borderColor} ${item.color}`}>
                      {item.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
          <span>Active Target: {caseData.vasp.name} (SLA: {caseData.vasp.sla || '47 min'})</span>
          <span className="text-[#D4FF32] font-semibold">Under Section 91 CrPC</span>
        </div>
      </div>
    </div>
  );
};
