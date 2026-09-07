import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

/**
 * FreezeProtocol.jsx
 * Freeze protocol button and trigger component with STRICTLY NO auto-scroll behavior.
 * - No scrollIntoView()
 * - No focus()
 * - No window.scrollTo()
 * - No autoFocus attribute
 * - Simple onClick={handleFreeze}
 */
export const FreezeProtocol = ({
  onFreeze,
  disabled = false,
  label = 'Initiate Freeze Protocol',
  stage = 0,
  className = '',
}) => {
  const handleFreeze = (e) => {
    // Strictly execute callback with NO scroll behavior
    if (typeof onFreeze === 'function') {
      onFreeze(e);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        id="btn-generate-freeze-protocol"
        type="button"
        disabled={disabled}
        onClick={handleFreeze}
        className="relative group px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-red-600/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 active:scale-98"
      >
        <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
        <span>{label}</span>
      </button>

      {stage > 0 && (
        <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400/90 px-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Section 94 BNSS statutory escalation active</span>
        </div>
      )}
    </div>
  );
};

export default FreezeProtocol;
