import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';

export interface TravelingDotEdgeData {
  amount?: string;
  time?: string;
  color?: string;
}

export const TravelingDotEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as unknown as TravelingDotEdgeData | undefined;
  const labelText = edgeData?.amount
    ? `${edgeData.amount} • ${edgeData?.time || ''}`
    : edgeData?.time || '';

  const edgeColor = edgeData?.color || '#39FF14';

  return (
    <>
      {/* Background Glow Path */}
      <path
        d={edgePath}
        fill="none"
        stroke={edgeColor}
        strokeWidth={3.5}
        strokeOpacity={0.25}
      />

      {/* Main Dashed Animated Path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: 2,
          strokeDasharray: '6, 6',
          animation: 'dash-flow 1s linear infinite',
        }}
      />

      {/* Traveling glowing Kryptonite particle dot with bright core */}
      <circle r="4.5" fill="#39FF14" filter="drop-shadow(0 0 8px #39FF14)">
        <animateMotion
          path={edgePath}
          dur="1.4s"
          repeatCount="indefinite"
          rotate="auto"
        />
      </circle>
      <circle r="2" fill="#F0FFF0">
        <animateMotion
          path={edgePath}
          dur="1.4s"
          repeatCount="indefinite"
          rotate="auto"
        />
      </circle>

      {/* Edge label box in center */}
      {labelText && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="px-2.5 py-1 rounded bg-[#0A110A]/95 border border-[#39FF14]/25 text-[#F0FFF0] font-mono text-[11px] font-semibold shadow-[0_4px_16px_rgba(57,255,20,0.15)] backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_6px_#39FF14]" />
              <span>{labelText}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
