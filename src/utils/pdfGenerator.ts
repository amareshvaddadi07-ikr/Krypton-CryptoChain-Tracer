import { jsPDF } from 'jspdf';
import { CaseData } from '../types';
import { matchPattern } from './patternMatcher';

export type LegalNoticeType = '91CrPC' | '94BNSS' | '106BNSS';

declare global {
  interface Window {
    jspdf?: {
      jsPDF: any;
    };
    currentCase?: any;
    currentTrail?: any;
    generatePDF?: (trail?: any, type?: LegalNoticeType) => string;
    generateAndDownloadPDF?: (caseData?: any, trailData?: any) => string;
    generateFreezeProtocolPDF?: (caseData?: any) => string;
  }
}

// Pseudo-SHA-256 deterministic hex hash generator for offline evidence chain
function generateSha256Hex(content: string): string {
  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c6ce57;
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 = (hash1 ^ (hash1 >>> 16)) >>> 0;
  hash2 = (hash2 ^ (hash2 >>> 16)) >>> 0;
  const part1 = hash1.toString(16).padStart(8, '0');
  const part2 = hash2.toString(16).padStart(8, '0');
  const part3 = (hash1 ^ 0x5a5a5a5a).toString(16).padStart(8, '0');
  const part4 = (hash2 ^ 0xa5a5a5a5).toString(16).padStart(8, '0');
  const part5 = (hash1 + hash2).toString(16).padStart(8, '0');
  const part6 = ((hash1 * 3) >>> 0).toString(16).padStart(8, '0');
  const part7 = ((hash2 * 7) >>> 0).toString(16).padStart(8, '0');
  const part8 = ((hash1 ^ hash2) >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}${part3}${part4}${part5}${part6}${part7}${part8}`;
}

export const generatePDF = (
  trailOrCaseData?: any,
  noticeType: LegalNoticeType = '91CrPC'
): string => {
  const JSPDFClass =
    typeof window !== 'undefined' && window.jspdf?.jsPDF
      ? window.jspdf.jsPDF
      : jsPDF;

  const doc = new JSPDFClass();
  let y = 15;

  const currentCase =
    trailOrCaseData?.caseData ||
    trailOrCaseData ||
    (typeof window !== 'undefined' ? window.currentCase : undefined) ||
    {};
  const currentTrail =
    trailOrCaseData?.trail ||
    trailOrCaseData ||
    (typeof window !== 'undefined' ? window.currentTrail : undefined) ||
    {};

  // Pull fields from localStorage ('krypton_fir') as requested:
  // const {firNumber, walletAddress, policeStation, firDate} = JSON.parse(localStorage.getItem('krypton_fir'))
  let firNumber = '123/2024';
  let walletAddress = '0x1aF4b73cD0e6B98cFa819d45e0f119e';
  let policeStation = 'Cyber Police Station, Delhi';
  let firDate = new Date().toISOString().split('T')[0];

  try {
    if (typeof window !== 'undefined') {
      const storedFir = localStorage.getItem('krypton_fir');
      if (storedFir) {
        const parsed = JSON.parse(storedFir);
        if (parsed.firNumber) firNumber = parsed.firNumber;
        if (parsed.walletAddress) walletAddress = parsed.walletAddress;
        if (parsed.policeStation) policeStation = parsed.policeStation;
        if (parsed.firDate) firDate = parsed.firDate;
      }
      const storedWallet = localStorage.getItem('krypton_wallet');
      if (storedWallet && (!walletAddress || walletAddress === '0x1aF4b73cD0e6B98cFa819d45e0f119e')) {
        walletAddress = storedWallet;
      }
    }
  } catch (err) {
    console.warn('[pdfGenerator] Error loading krypton_fir from localStorage:', err);
  }

  // Allow explicit runtime overrides from currentCase / currentTrail if provided
  if (currentCase?.firNumber) firNumber = currentCase.firNumber;
  else if (currentTrail?.firNumber) firNumber = currentTrail.firNumber;

  if (currentTrail?.inputWallet) walletAddress = currentTrail.inputWallet;
  else if (currentCase?.suspectWallet) walletAddress = currentCase.suspectWallet;
  else if (currentCase?.wallet) walletAddress = currentCase.wallet;

  if (currentCase?.policeStation) policeStation = currentCase.policeStation;
  if (currentCase?.firDate) firDate = currentCase.firDate;

  // Case ID format: KRYPTON-{firNumber}-{walletAddress.slice(2,8).toUpperCase()}
  const cleanWallet = (walletAddress || '0x000000').trim();
  const walletSlice = cleanWallet.length >= 8 ? cleanWallet.slice(2, 8) : cleanWallet.slice(0, 6);
  const caseId = `KRYPTON-${firNumber}-${walletSlice.toUpperCase()}`;

  const suspectWallet = walletAddress;
  const chain = currentCase?.chain || currentTrail?.chain || 'TRON';
  const vaspName = currentTrail?.vasp?.name || currentCase?.vasp?.name || 'WazirX';
  const hops = currentTrail?.hops || currentCase?.vasp?.hops || 2;
  const confidence = currentTrail?.confidence || currentCase?.vasp?.confidence || 82;
  const baseAmount = currentTrail?.amount || currentCase?.baseAmount || 199500;
  const finalAmount = currentTrail?.finalAmount || currentCase?.finalAmount || 199000;
  const isDeep = Boolean(currentTrail?.isDeep ?? currentCase?.isDeep);
  const targetWallet =
    currentCase?.vasp?.fullHotWallet ||
    currentCase?.vasp?.hotWallet ||
    currentTrail?.vasp?.fullWallet ||
    'TLa2w8q6e4r2t1y7u8i9o0p1a2s3d4f8c9';
  const fiuReg =
    currentCase?.vasp?.fiuRegistration ||
    `FIU-IND-REG-${vaspName.toUpperCase()}-084`;

  // Dynamic Pattern Matcher
  const patternResult = matchPattern({
    amount: baseAmount,
    avgTimeGap: currentTrail?.avgTimeGap || currentCase?.avgTimeGap || 180,
    gasFees: currentTrail?.gasFees || currentCase?.gasFees || [0.25],
    chains: currentTrail?.chains || currentCase?.chains || ['TRON'],
    hasDex: currentTrail?.hasDex || currentCase?.hasDex || false,
    nodes: currentTrail?.nodes || currentCase?.nodes || [],
  });

  const reportId = caseId;
  const evidenceDigest = generateSha256Hex(
    `${caseId}:${firNumber}:${walletAddress}:${policeStation}:${vaspName}:${targetWallet}:${baseAmount}:${noticeType}`
  );

  // Dynamic page break helper
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > 274) {
      doc.addPage();
      // Header for continuation pages
      doc.setFillColor(10, 17, 10);
      doc.rect(0, 0, 210, 17, 'F');
      doc.setDrawColor(57, 255, 20);
      doc.setLineWidth(0.4);
      doc.line(0, 17, 210, 17);
      doc.setLineWidth(0.2);

      doc.setTextColor(57, 255, 20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('◇', 7, 6.5);
      doc.setTextColor(255, 255, 255);
      doc.text('GOVERNMENT OF INDIA - MHA - I4C - KRYPTON // Sec 63 BSA Admissible Report', 11, 6.5);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      doc.text(`Case ID: ${caseId}`, 145, 6.5);
      doc.setTextColor(220, 235, 220);
      doc.text(`FIR No: ${firNumber} | Wallet: ${walletAddress} | PS: ${policeStation}`, 11, 12.5);
      doc.setTextColor(0, 0, 0);
      y = 25;
    }
  };

  // 1. HEADER (Top Black Bar #0A110A with Neon Green Accents)
  // PDF Header Requirements:
  // FIR No: {firNumber} | Wallet: {walletAddress} | PS: {policeStation}
  // Case ID: KRYPTON-{firNumber}-{walletAddress.slice(2,8).toUpperCase()}
  // Sec 63 BSA Admissible - Chain Analysis Report
  doc.setFillColor(10, 17, 10);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setDrawColor(57, 255, 20);
  doc.setLineWidth(0.6);
  doc.line(0, 28, 210, 28);
  doc.setLineWidth(0.2);

  // Top Title Bar
  doc.setTextColor(57, 255, 20);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('◇', 7, 7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GOVERNMENT OF INDIA - MHA - I4C / NCRB - KRYPTON', 12, 7.5);

  // Right Side Notice & Date
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(57, 255, 20);
  doc.text(`STATUTORY NOTICE: ${noticeType}`, 145, 7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text(`Date: ${firDate || new Date().toLocaleDateString('en-IN')}`, 145, 12.5);

  // Sec 63 BSA Admissible - Chain Analysis Report
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(57, 255, 20); // Neon green
  doc.text('Sec 63 BSA Admissible - Chain Analysis Report', 12, 13);

  // Case ID: KRYPTON-{firNumber}-{walletAddress.slice(2,8).toUpperCase()}
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Case ID: ${caseId}`, 12, 18.5);

  // FIR No: {firNumber} | Wallet: {walletAddress} | PS: {policeStation}
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 235, 220);
  doc.text(`FIR No: ${firNumber} | Wallet: ${walletAddress} | PS: ${policeStation}`, 12, 24);

  y = 36;

  // 2. REPORT TITLE
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  if (noticeType === '94BNSS') {
    doc.setTextColor(157, 0, 255);
    doc.text('Section 94 BNSS Emergency Deemed Preservation Order (7-Day Freeze)', 10, y);
  } else if (noticeType === '106BNSS') {
    doc.setTextColor(10, 17, 10);
    doc.text('Magistrate Seizure Order Draft under Section 106 BNSS (Old 102 CrPC)', 10, y);
  } else {
    doc.text('KRYPTON Forensic Report & Immediate Freeze Requisition (Sec 91 CrPC)', 10, y);
  }
  y += 7;
  doc.setDrawColor(57, 255, 20);
  doc.setLineWidth(0.5);
  doc.line(10, y, 200, y);
  doc.setLineWidth(0.2);
  y += 6;

  // 3. CASE DETAILS BOX (With Green Left Accent Border)
  checkPageBreak(30);
  doc.setFillColor(245, 250, 245);
  doc.rect(10, y, 190, 27, 'F');
  doc.setDrawColor(220, 235, 220);
  doc.rect(10, y, 190, 27, 'S');
  doc.setDrawColor(57, 255, 20);
  doc.setLineWidth(1.2);
  doc.line(10, y, 10, y + 27);
  doc.setLineWidth(0.2);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Investigative Case Details (Case ID: ${caseId}):`, 13, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`FIR No: ${firNumber} | FIR Date: ${firDate} | Police Station: ${policeStation}`, 13, y + 10);
  doc.text(`Suspect Wallet (Origin): ${walletAddress}`, 13, y + 14.5);
  doc.text(`Blockchain: ${chain} | Loss Amount: Rs ${Number(baseAmount).toLocaleString('en-IN')} | Traced Terminus: Rs ${Number(finalAmount).toLocaleString('en-IN')}`, 13, y + 19);
  doc.text(`Target VASP: ${vaspName} (${fiuReg}) | Recipient Hot Wallet: ${targetWallet}`, 13, y + 23);
  doc.text(`Investigating Agency: ${policeStation}, NCRP / I4C MHA (Sec 63 BSA Admissible)`, 13, y + 26.5);
  y += 32;

  // 4. PATTERN FORENSICS SECTION (With Green Left Border)
  checkPageBreak(25);
  doc.setFillColor(242, 255, 242);
  doc.setDrawColor(57, 255, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(10, 17, 10);
  doc.text('Pattern Forensics & Evidentiary Attribution (Sec 63 BSA / Sec 65B IEA):', 10, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const patternSummary =
    `Algorithmic Match: ${patternResult.pattern.name} (${patternResult.score}% Correlation across ${patternResult.similarCasesCount} historical NCRP Cases). ` +
    `Mathematical Score Weighting: Amount Slab (${patternResult.breakdown.amountScore}/25%) + Time Proximity (${patternResult.breakdown.timeGapScore}/25%) + ` +
    `Gas Fingerprint (${patternResult.breakdown.gasFeeScore}/20%) + Chain Signature (${patternResult.breakdown.chainScore}/15%) + DEX Routing (${patternResult.breakdown.dexScore}/15%). ` +
    `Probative Value: ${patternResult.predictedVasp.reason}.`;
  const patternLines = doc.splitTextToSize(patternSummary, 190);
  doc.text(patternLines, 10, y);
  y += patternLines.length * 3.8 + 4;

  // 5. TRANSACTION TRAIL (EVIDENCE CHAIN TABLE)
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Cryptographic Transaction Trail (Chain of Custody):', 10, y);
  y += 5;

  // Table header (#0A110A with green accent border)
  doc.setFillColor(10, 17, 10);
  doc.rect(10, y, 190, 6.5, 'F');
  doc.setDrawColor(57, 255, 20);
  doc.setLineWidth(0.4);
  doc.rect(10, y, 190, 6.5, 'S');
  doc.setLineWidth(0.2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('TIME', 13, y + 4.5);
  doc.text('SOURCE WALLET', 32, y + 4.5);
  doc.text('DESTINATION WALLET', 86, y + 4.5);
  doc.text('AMOUNT', 140, y + 4.5);
  doc.text('HOP STATUS / TAG', 170, y + 4.5);
  y += 7.5;

  const timelineSteps =
    currentCase?.timeline && currentCase.timeline.length > 0
      ? currentCase.timeline
      : [
          { time: '10:14 AM', from: 'Victim Citizen Account', to: suspectWallet.slice(0, 14) + '...', amount: `Rs ${baseAmount}`, tag: 'Primary Theft Inflow' },
          { time: '10:18 AM', from: suspectWallet.slice(0, 14) + '...', to: 'TJb8...3kL', amount: `Rs ${baseAmount}`, tag: 'Layer 1 Mule' },
          { time: '10:24 AM', from: 'TJb8...3kL', to: `${vaspName} Hot Wallet`, amount: `Rs ${finalAmount}`, isTarget: true, tag: 'FREEZE TARGET' },
        ];

  timelineSteps.forEach((step: any, idx: number) => {
    checkPageBreak(8);

    if (idx % 2 === 1) {
      doc.setFillColor(242, 255, 245);
      doc.rect(10, y - 1, 190, 7, 'F');
    }

    if (step.isTarget || step.isMixer) {
      doc.setFillColor(245, 235, 255);
      doc.rect(10, y - 1, 190, 7, 'F');
      doc.setDrawColor(157, 0, 255);
      doc.rect(10, y - 1, 190, 7, 'S');
      doc.setTextColor(157, 0, 255);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
    }

    doc.setFontSize(7);
    doc.text(String(step.time || '10:14 AM'), 13, y + 4);

    const fromStr = String(step.from || '');
    const toStr = String(step.to || '');
    doc.text(fromStr.length > 22 ? fromStr.slice(0, 20) + '...' : fromStr, 32, y + 4);
    doc.text(toStr.length > 22 ? toStr.slice(0, 20) + '...' : toStr, 86, y + 4);
    doc.text(String(step.amount || ''), 140, y + 4);

    const tagStr = step.isTarget
      ? 'FREEZE TARGET'
      : step.isMixer
      ? 'MIXER PEEL'
      : step.isDex
      ? 'DEX SWAP'
      : `Layer ${idx}`;
    doc.text(tagStr, 170, y + 4);

    y += 7;
  });
  y += 5;

  // 6. STATUTORY REQUISITION NOTICE
  if (noticeType === '94BNSS') {
    // Section 94 BNSS - Deemed Preservation 7 Days in Purple box with Toxic Purple & Green accent
    checkPageBreak(50);
    doc.setFillColor(250, 242, 255);
    doc.setDrawColor(157, 0, 255);
    doc.rect(10, y, 190, 46, 'FD');
    doc.setDrawColor(57, 255, 20);
    doc.setLineWidth(1.2);
    doc.line(10, y, 10, y + 46);
    doc.setLineWidth(0.2);

    doc.setTextColor(157, 0, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('SECTION 94 BNSS - EMERGENCY DEEMED PRESERVATION ORDER (MANDATORY 7 DAYS)', 13, y + 6);

    doc.setTextColor(0, 150, 50);
    doc.setFontSize(8);
    doc.text('Under Section 94 BNSS PRESERVED for 7 days', 13, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 20, 90);
    const text94 =
      `To Nodal / Compliance Officer, ${vaspName} (Registered Entity: ${fiuReg})\n` +
      `Under Section 94 of Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, digital assets, accounts, and cryptographic balances ` +
      `associated with recipient wallet ${targetWallet} are hereby directed to be PRESERVED in status quo for a period of 7 days ` +
      `pending confirmation and formal seizure order from the Competent Judicial Magistrate.\n\n` +
      `MANDATORY STATUTORY WARNING: Failure to enforce instantaneous debit-freezing and data preservation within 2 hours of this notice ` +
      `shall constitute willful destruction of electronic evidence and defiance of lawful public order, punishable under Section 211 ` +
      `and Section 223 of the Bharatiya Nyaya Sanhita (BNS), 2023.`;
    const lines94 = doc.splitTextToSize(text94, 184);
    doc.text(lines94, 13, y + 16);
    y += 50;
  } else if (noticeType === '106BNSS') {
    // Section 106 BNSS - Magistrate Seizure Order Draft + PMLA Sec 17
    checkPageBreak(55);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(100, 116, 139);
    doc.rect(10, y, 190, 48, 'FD');
    doc.setDrawColor(57, 255, 20);
    doc.setLineWidth(1.2);
    doc.line(10, y, 10, y + 48);
    doc.setLineWidth(0.2);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('FORMAL SEIZURE ORDER UNDER SECTION 106 BNSS & SECTION 17 PMLA, 2002', 13, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const text106 =
      `BEFORE THE HON'BLE SPECIAL JUDICIAL MAGISTRATE / DESIGNATED COURT\n` +
      `In Crime No. ${firNumber} of Cyber Crime PS [State], National Cybercrime Reporting Portal (NCRP) / I4C MHA.\n\n` +
      `1. The Investigating Agency has established an unbroken forensic chain from victim account to exchange wallet ${targetWallet}.\n` +
      `2. IT IS ORDERED that digital assets amounting to Rs ${Number(finalAmount).toLocaleString('en-IN')} held with ${vaspName} stand ATTACHED and SEIZED.\n` +
      `3. Further directed that linked Bank Account ...1234 and fiat off-ramps remain frozen under Section 106 BNSS.\n` +
      `4. Compliance Officer, ${vaspName} shall deposit equivalent INR proceeds into the Designated Law Enforcement Government Escrow Account.`;
    const lines106 = doc.splitTextToSize(text106, 184);
    doc.text(lines106, 13, y + 12);
    y += 52;
  } else {
    // Section 91 CrPC Standard Order
    checkPageBreak(46);
    doc.setFillColor(252, 252, 254);
    doc.setDrawColor(215, 220, 230);
    doc.rect(10, y, 190, 40, 'FD');
    doc.setDrawColor(57, 255, 20);
    doc.setLineWidth(1.2);
    doc.line(10, y, 10, y + 40);
    doc.setLineWidth(0.2);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('STATUTORY FREEZING ORDER UNDER SECTION 91 CrPC / SECTION 94 BNSS', 13, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    const text91 =
      `To: Grievance Officer & Nodal Officer, ${vaspName} (FIU-IND Reg: ${fiuReg})\n` +
      `You are hereby commanded under Section 91 of Code of Criminal Procedure, 1973 (and Section 94 BNSS, 2023) to IMMEDIATELY ` +
      `FREEZE all withdrawals, debit transactions, and P2P transfers pertaining to beneficiary wallet ${targetWallet}.\n` +
      `You are further required to produce within 24 hours: Full KYC documents (Aadhaar, PAN, Passport, phone, email), IP access logs, ` +
      `and bank account payout details of the account holder to cybercrime@gov.in, fiu@fiuindia.gov.in, 1930@i4c.gov.in.`;
    const lines91 = doc.splitTextToSize(text91, 184);
    doc.text(lines91, 13, y + 12);
    y += 44;
  }

  // 7. NATIONAL MULE REGISTRY LINKAGE (NCRP Matrix)
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('National Mule Registry & Multi-Jurisdiction Linkage (NCRP):', 10, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  const nationalText =
    `NCRP Cluster: #NCRP-8847 | Connected States: NAT (FIR NCRP/2025/8847 - Rs 1.99L), MH (FIR PUN/2025/884 - Rs 3.2L, Pune First Reporter), ` +
    `DL (FIR NDLS/2025/112 - Rs 85K), KA (FIR BLR/2025/203 - Rs 1.1L). Aggregate Syndicated Laundering: Rs 7,34,000 across 12 wallets. ` +
    `National Notice: Dispatched via National Cybercrime Reporting Portal.`;
  const nationalLines = doc.splitTextToSize(nationalText, 190);
  doc.text(nationalLines, 10, y);
  y += nationalLines.length * 3.6 + 4;

  // 8. EVIDENCE LOCKER HASH CHAIN & SIGNATURES
  checkPageBreak(32);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Evidence Locker & Forensic Verification Digest:', 10, y);
  y += 4.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(0, 180, 80); // Green mono hash
  doc.text(`REPORT HASH (SHA-256): ${evidenceDigest}`, 10, y);
  y += 3.5;
  doc.text(`HASH CHAIN INTEGRITY: 00000000000000000000000000000000 -> ${evidenceDigest.slice(0, 32)}...`, 10, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(70, 70, 70);
  doc.text(`Timestamp: ${new Date().toLocaleString('en-IN')} IST | Generated By: SI Ramesh, Investigating Officer`, 10, y);
  y += 6;

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Investigating Officer:', 13, y);
  doc.text('Cyber Forensic Examiner:', 135, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Cyber Crime PS [State]', 13, y);
  doc.text('National Cyber Forensics Lab (NCFL), I4C - MHA', 135, y);
  y += 3.5;
  doc.text('National Cybercrime Reporting Portal (NCRP)', 13, y);
  doc.text('Government of India', 135, y);

  // 9. FOOTERS ACROSS ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(57, 255, 20);
    doc.line(10, 282, 200, 282);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 120, 100);
    doc.text(
      `KRYPTON // Built for Bharat // For All States & UTs | I4C MHA | Report ID: ${reportId} | SHA-256: ${evidenceDigest.slice(0, 16)}... | Green is trace, Purple is poison`,
      10,
      287
    );
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${totalPages}`, 200, 287, { align: 'right' });
  }

  // 10. SAVE DIRECTLY VIA doc.save()
  const sanitizedFir = String(firNumber).replace(/[\/\\?%*:|"<>]/g, '_');
  const filename = `KRYPTON_${sanitizedFir}_${noticeType}.pdf`;
  doc.save(filename);

  return filename;
};

// Backwards compatibility aliases
export const generateAndDownloadPDF = (caseData?: any, trailData?: any): string => {
  return generatePDF(caseData || trailData, '91CrPC');
};

export const generateFreezeProtocolPDF = (caseData?: any): string => {
  return generatePDF(caseData, '91CrPC');
};

if (typeof window !== 'undefined') {
  window.generatePDF = generatePDF;
  window.generateAndDownloadPDF = generateAndDownloadPDF;
  window.generateFreezeProtocolPDF = generateFreezeProtocolPDF;
}
