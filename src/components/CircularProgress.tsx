import React, { useEffect, useState } from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 56,
  strokeWidth = 4.5,
  color = '#39FF14',
  className = '',
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (currentProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentProgress(percentage);
    }, 150);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Active progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-white">
        {Math.round(currentProgress)}%
      </div>
    </div>
  );
};
