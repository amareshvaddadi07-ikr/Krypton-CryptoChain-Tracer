import React, { useState } from 'react';
import { InvestigateView } from '../../src/components/InvestigateView';
import { KryptonHeader } from '../../src/components/KryptonHeader';
import { generateDynamicTrail } from '../../src/utils/dynamicTrail';
import { CASE_PRESETS } from '../../src/data/presets';
import { CaseData } from '../../src/types';

export default function ReportPage() {
  const [walletInput, setWalletInput] = useState<string>('TQa9s3q4o1k2f3a4s5d6f7g8h9j0k1l2m3n');
  const [currentCase, setCurrentCase] = useState<CaseData>(() => {
    const initial = generateDynamicTrail('TQa9s3q4o1k2f3a4s5d6f7g8h9j0k1l2m3n');
    return initial.caseData;
  });

  const handleInvestigate = () => {
    const result = generateDynamicTrail(walletInput);
    setCurrentCase(result.caseData);
  };

  const handleSelectPreset = (preset: CaseData) => {
    setWalletInput(preset.suspectWallet);
    setCurrentCase(preset);
  };

  return (
    <div className="min-h-screen h-auto overflow-y-auto bg-[#050805] text-white flex flex-col font-sans">
      <KryptonHeader firNumber={currentCase.firNumber} />
      <main className="flex-1 w-full h-auto">
        <InvestigateView
          walletInput={walletInput}
          setWalletInput={setWalletInput}
          caseData={currentCase}
          presets={CASE_PRESETS}
          onSelectPreset={handleSelectPreset}
          onInvestigate={handleInvestigate}
        />
      </main>
    </div>
  );
}
