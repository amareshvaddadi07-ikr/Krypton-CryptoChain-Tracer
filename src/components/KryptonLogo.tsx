import React from 'react';

interface KryptonLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const KryptonLogo: React.FC<KryptonLogoProps> = ({
  size = 56,
  className = '',
  glow = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        filter: glow ? 'drop-shadow(0 0 18px rgba(57,255,20,0.6))' : undefined,
      }}
    >
      <img
        src="/krypton-logo.svg"
        alt="KRYPTON - National VASP Detector Official Badge"
        width={size}
        height={size}
        className="w-full h-full object-contain rounded-full bg-transparent"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
