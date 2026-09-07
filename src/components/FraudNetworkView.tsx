import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Network,
  ShieldAlert,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Landmark,
  Share2,
  Layers,
  FileCheck2,
} from 'lucide-react';

interface FraudNetworkViewProps {
  currentFir: string;
  suspectWallet: string;
}

export const FraudNetworkView: React.FC<FraudNetworkViewProps> = ({
  currentFir,
  suspectWallet,
}) => {
  const [joinedNationalCase, setJoinedNationalCase] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>('upi');

  const networkData = {
    upi: 'rajeshkumar.mule99@axl',
    bank: 'SBI A/C No. ...1234 (Central Branch)',
    beneficiary: 'Rajesh Kumar (Syndicate Account Holder)',
    linkedFIRs: 12,
    totalAmount: 734000,
    states: ['NAT', 'MH', 'DL', 'KA'],
    vasps: ['WazirX Hot Wallet', 'Binance Hot Wallet', 'CoinDCX Hot Wallet', 'CoinSwitch Hot Wallet'],
  };

  const nationalCases = [
    {
      state: 'NAT',
      stateName: 'Current Jurisdiction',
      fir: currentFir || 'NCRP/2025/8847',
      ps: 'Cyber Crime PS [State]',
      amount: '₹1,99,000',
      date: 'Today (Active)',
      isYou: true,
      status: 'Investigation Active',
      badgeColor: 'text-[#39FF14] bg-[#39FF14]/10 border-[#39FF14]/30',
    },
    {
      state: 'MH',
      stateName: 'Maharashtra',
      fir: 'PUN/2025/884',
      ps: 'Pune Cyber Crime Police Station',
      amount: '₹3,20,000',
      date: '2 days ago',
      isFirstReporter: true,
      status: 'Freeze Dispatched (First Reporter)',
      badgeColor: 'text-[#39FF14] bg-[#39FF14]/15 border-[#39FF14]/40',
    },
    {
      state: 'DL',
      stateName: 'Delhi Cyber Police',
      fir: 'NDLS/2025/112',
      ps: 'Delhi Central Cyber Crime PS',
      amount: '₹85,000',
      date: '4 days ago',
      status: 'Notice Issued',
      badgeColor: 'text-[#00FF88] bg-[#00FF88]/10 border-[#00FF88]/30',
    },
    {
      state: 'KA',
      stateName: 'Karnataka',
      fir: 'BLR/2025/203',
      ps: 'Bengaluru Cyber Command (CCB)',
      amount: '₹1,10,000',
      date: '5 days ago',
      status: 'KYC Received',
      badgeColor: 'text-[#B026FF] bg-[#9D00FF]/15 border-[#9D00FF]/30',
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Banner Alert */}
      <div className="p-3.5 rounded-xl bg-[#9D00FF]/15 border border-[#9D00FF]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#9D00FF]/25 border border-[#9D00FF]/50 flex items-center justify-center text-[#B026FF] shrink-0 shadow-[0_0_10px_rgba(157,0,255,0.3)]">
            <Network className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-[#D8B4FE] font-bold tracking-tight">
              NATIONAL MULE REGISTRY // SYNDICATED FRAUD CLUSTER
            </div>
            <div className="text-[#8BA88B] text-[11px] mt-0.5">
              Identified UPI <strong className="text-white font-semibold">{networkData.upi}</strong> linked to{' '}
              <strong className="text-[#39FF14]">12 Cyber Crime FIRs</strong> across 4 Indian states. Total proceeds:{' '}
              <strong className="text-[#FF00A8]">₹7,34,000</strong>.
            </div>
          </div>
        </div>

        <button
          onClick={() => setJoinedNationalCase(true)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 ${
            joinedNationalCase
              ? 'bg-[#39FF14] text-black border border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.4)]'
              : 'bg-[#0A110A] text-[#39FF14] hover:bg-[#39FF14] hover:text-black border border-[#39FF14]/40 active:scale-95 shadow-[0_0_10px_rgba(57,255,20,0.15)]'
          }`}
        >
          {joinedNationalCase ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>LINKED TO #NCRP-8847</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Join National Freeze Case #NCRP-8847</span>
            </>
          )}
        </button>
      </div>

      {/* Network Graph Interactive Visualization Area */}
      <div className="w-full min-h-[380px] p-4 bg-[#0A110A]/90 border border-[#39FF14]/20 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center">
        {/* Background grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#39ff140d_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Concentric rings to symbolize multi-tier syndicate infrastructure */}
        <div className="absolute w-[460px] h-[460px] rounded-full border border-[#39FF14]/[0.06] pointer-events-none" />
        <div className="absolute w-[320px] h-[320px] rounded-full border border-[#9D00FF]/[0.08] pointer-events-none" />
        <div className="absolute w-[180px] h-[180px] rounded-full border border-[#9D00FF]/20 pointer-events-none animate-spin-slow" />

        {/* Center Node: Primary Mule UPI & Bank */}
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          onClick={() => setSelectedNode('upi')}
          className={`relative z-20 p-3 sm:p-4 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all ${
            selectedNode === 'upi'
              ? 'bg-[#0E1A0E] border-[#9D00FF] shadow-[0_0_30px_rgba(157,0,255,0.4)]'
              : 'bg-[#0A110A] border-[#9D00FF]/40 hover:border-[#9D00FF]'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B026FF] animate-ping" />
            <span className="text-[10px] font-mono text-[#D8B4FE] font-bold uppercase tracking-wider">
              CENTRAL SYNDICATE MULE
            </span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white font-mono">{networkData.upi}</div>
          <div className="text-[10px] font-mono text-[#8BA88B] mt-0.5">{networkData.bank}</div>
          <div className="mt-2 pt-2 border-t border-[#9D00FF]/25 flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#D8B4FE] font-bold">12 LINKED FIRs</span>
            <span className="text-[#39FF14] font-bold">₹7,34,000 TOTAL</span>
          </div>
        </motion.div>

        {/* Orbiting / Surrounding Connected Clusters */}
        <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 z-10">
          {nationalCases.map((nc) => (
            <motion.div
              key={nc.state}
              whileHover={{ scale: 1.03 }}
              className={`p-3 rounded-xl border backdrop-blur-md flex flex-col justify-between transition-all ${
                nc.isYou
                  ? 'bg-[#39FF14]/10 border-[#39FF14]/40 shadow-[0_0_15px_rgba(57,255,20,0.15)]'
                  : 'bg-[#050805]/60 border-[#39FF14]/15 hover:border-[#39FF14]/35'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${nc.badgeColor}`}>
                  {nc.state} POLICE
                </span>
                {nc.isYou && (
                  <span className="text-[9px] font-mono text-[#39FF14] font-bold">YOU</span>
                )}
                {nc.isFirstReporter && (
                  <span className="text-[8.5px] font-mono text-[#39FF14] font-bold">1st REPORTER</span>
                )}
              </div>

              <div className="my-2">
                <div className="text-xs font-bold font-mono text-white">{nc.fir}</div>
                <div className="text-[10px] font-mono text-[#8BA88B] truncate">{nc.ps}</div>
              </div>

              <div className="pt-2 border-t border-[#39FF14]/10 flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#8BA88B]">{nc.date}</span>
                <span className="text-[#39FF14] font-bold">{nc.amount}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[9.5px] font-mono text-[#8BA88B] z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#9D00FF]" />
            <span>UPI Mule Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#39FF14]" />
            <span>First Reporter (MH - Freeze Dispatched)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF00A8]" />
            <span>Active Case (Your Police Station)</span>
          </div>
        </div>
      </div>

      {/* National Coordination Table */}
      <div className="p-4 bg-[#0A110A]/80 border border-[#39FF14]/20 rounded-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#39FF14]" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              National Mule Coordination Matrix (NCRP)
            </h3>
          </div>
          <div className="text-[10px] font-mono text-[#8BA88B]">
            CLUSTER HASH: <span className="text-[#F0FFF0]">#NCRP-8847-NAT</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#39FF14]/15 text-[10px] text-[#8BA88B] uppercase">
                <th className="pb-2">State / Agency</th>
                <th className="pb-2">FIR Number</th>
                <th className="pb-2">Police Station</th>
                <th className="pb-2">Loss Amount</th>
                <th className="pb-2">Time Reported</th>
                <th className="pb-2">National Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#39FF14]/10 text-[#F0FFF0]">
              {nationalCases.map((row) => (
                <tr key={row.fir} className={row.isYou ? 'bg-[#39FF14]/5' : ''}>
                  <td className="py-2.5 font-bold flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${row.isYou ? 'bg-[#39FF14]' : 'bg-[#00FF88]'}`} />
                    <span>{row.stateName}</span>
                  </td>
                  <td className="py-2.5 font-semibold text-white">{row.fir}</td>
                  <td className="py-2.5 text-[#8BA88B] text-[11px]">{row.ps}</td>
                  <td className="py-2.5 font-bold text-[#39FF14]">{row.amount}</td>
                  <td className="py-2.5 text-[#8BA88B]">{row.date}</td>
                  <td className="py-2.5">
                    {row.isFirstReporter ? (
                      <span className="px-2 py-0.5 rounded bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-[10px] font-bold">
                        FREEZE ORDER SENT
                      </span>
                    ) : row.isYou ? (
                      joinedNationalCase ? (
                        <span className="px-2 py-0.5 rounded bg-[#39FF14]/20 border border-[#39FF14]/40 text-[#39FF14] text-[10px] font-bold">
                          ✓ REQUISITION JOINED
                        </span>
                      ) : (
                        <button
                          onClick={() => setJoinedNationalCase(true)}
                          className="px-2.5 py-1 rounded-lg bg-[#39FF14] hover:bg-[#7FFF67] text-black font-bold text-[10px] transition-all cursor-pointer shadow-[0_0_10px_rgba(57,255,20,0.3)]"
                        >
                          Join National Freeze
                        </button>
                      )
                    ) : (
                      <span className="text-[#8BA88B] text-[10px]">{row.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
