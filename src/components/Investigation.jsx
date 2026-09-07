import React, { useEffect, useRef } from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { InvestigateView } from './InvestigateView';

export const Investigation = ({ walletAddress, caseData, ...props }) => {
  const {
    resetEscalationLadder,
    startNewLadder,
    currentStage,
    status,
    nextEscalationAt,
  } = useInvestigation();

  const prevWalletRef = useRef(null);

  // Restart statutory ladder when wallet address is changed
  useEffect(() => {
    if (walletAddress && walletAddress !== prevWalletRef.current) {
      prevWalletRef.current = walletAddress;
      resetEscalationLadder();
      startNewLadder(walletAddress);
    }
  }, [walletAddress, resetEscalationLadder, startNewLadder]);

  return <InvestigateView walletInput={walletAddress} caseData={caseData} {...props} />;
};

export default Investigation;
