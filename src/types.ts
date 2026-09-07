export interface TransactionStep {
  time: string;
  from: string;
  to: string;
  amount: string;
  txHash: string;
  isTarget?: boolean;
  tag?: string;
  isPeel?: boolean;
  isMixer?: boolean;
  isDex?: boolean;
  peelPercent?: number;
}

export interface VaspDetail {
  name: string;
  hotWallet: string;
  fullHotWallet: string;
  complianceEmail: string;
  nodalEmail: string;
  ccEmail: string;
  hops: number;
  hopsText: string;
  confidence: number;
  breakdown: string;
  sla?: string;
  fiuRegistration?: string;
}

export interface CaseData {
  id: string;
  title: string;
  amountFormatted: string;
  rawAmount: string;
  firNumber: string;
  suspectWallet: string;
  chain: string;
  vasp: VaspDetail;
  timeline: TransactionStep[];
  riskBadge: string;
  txHash: string;
  investigationTimestamp: string;
  isDeep?: boolean;
  peelingCount?: number;
  finalAmount?: number;
  baseAmount?: number;
  gasFees?: number[];
  timeGaps?: number[];
  avgTimeGap?: number;
  chains?: string[];
  hasDex?: boolean;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      subLabel: string;
      wallet: string;
      amount: string;
      category: 'scammer' | 'layer' | 'exchange' | 'mixer' | 'dex';
      isTarget?: boolean;
      isMixer?: boolean;
      isDex?: boolean;
      peelPercent?: number;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    label?: string;
    from?: string;
    to?: string;
    isPeel?: boolean;
    isFreeze?: boolean;
    data: {
      amount: string;
      time: string;
      color?: string;
      isPeel?: boolean;
    };
  }>;
}
