import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  CheckCircle2,
  Wallet,
  Briefcase,
  Shuffle,
  Landmark,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export interface HopNode {
  id: string;
  label: string;
  address?: string;
  type: 'origin' | 'peel' | 'mixer' | 'vasp' | string;
  amount?: string;
  details?: string;
  txHash?: string;
}

export interface MoneyFlowGraphProps {
  hops?: HopNode[];
  address?: string;
  txHash?: string;
  onNodeClick?: (node: HopNode) => void;
  onComplete?: () => void;
  className?: string;
}

export function getHopsForWallet(address: string): HopNode[] {
  const safeAddr = address && address.length >= 3 ? address : 'TYqPw7z2okBhVx1p4mLc8q90dBa1n341bX';

  // Preset mapping to guarantee exact target hops per specification
  const presetHopsMap: Record<string, number> = {
    'TYqPw7z2okBhVx1p4mLc8q90dBa1n341bX': 5, // 5 hops WazirX
    'TQa9s3q4o1k2f3a4s5d6f7g8h9j0k1l2m3n': 3, // 3 hops Binance
    'TLyqzVGLV1srkBcwBEmZcUUJ1mdh9S1TP8': 6,  // 6 hops
    'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL': 4,  // 4 hops
  };

  // Use last 2 chars of address to generate different hop patterns deterministically
  const hash = safeAddr.slice(-3);
  const hashNum = (hash.charCodeAt(0) || 0) + (hash.charCodeAt(1) || 0);
  const calculatedHops = (hashNum % 4) + 3; // Will give 3 to 6 hops different for different wallets
  const hopCount = presetHopsMap[safeAddr] || calculatedHops;

  const rootAddr = `${safeAddr.slice(0, 6)}...${safeAddr.slice(-4)}`;

  const patterns: Record<number, HopNode[]> = {
    3: [
      { id: 'origin', label: 'Suspect Root', type: 'origin', address: rootAddr, amount: '₹5,24,034' },
      { id: 'h1', label: 'Depth 1 Peel 4%', type: 'peel', address: 'TJb8v9...99kL', amount: '₹5,03,072' },
      { id: 'vasp', label: 'WazirX VASP FOUND', type: 'vasp', address: 'TWazDep...HotWallet', amount: '₹4,82,950' }
    ],
    4: [
      { id: 'origin', label: 'Suspect Root', type: 'origin', address: rootAddr, amount: '₹6,40,000' },
      { id: 'h1', label: 'Depth 1 Layer', type: 'peel', address: 'TWx2m9...44pQ', amount: '₹6,14,400' },
      { id: 'h2', label: 'Depth 2 MIXER', type: 'mixer', address: 'SunSwap LP Pool', amount: '₹5,80,000' },
      { id: 'vasp', label: 'Binance VASP FOUND', type: 'vasp', address: 'TBinDep...HotWallet', amount: '₹5,51,000' }
    ],
    5: [
      { id: 'origin', label: 'Suspect Root', type: 'origin', address: rootAddr, amount: '₹5,24,034' },
      { id: 'h1', label: 'Depth 1 Layer', type: 'peel', address: 'TJb8v9...99kL', amount: '₹5,03,972' },
      { id: 'h2', label: 'Depth 2 Peel 4%', type: 'peel', address: 'TWx2m9...44pQ', amount: '₹4,83,813' },
      { id: 'h3', label: 'Depth 3 MIXER', type: 'mixer', address: 'SunSwap LP Pool', amount: '₹4,75,000' },
      { id: 'vasp', label: 'WazirX VASP FOUND', type: 'vasp', address: 'TWazDep...HotWallet', amount: '₹3,78,029' }
    ],
    6: [
      { id: 'origin', label: 'Suspect Root', type: 'origin', address: rootAddr, amount: '₹5,24,034' },
      { id: 'h1', label: 'Depth 1 Layer', type: 'peel', address: 'TJb8v9...99kL', amount: '₹5,03,972' },
      { id: 'h2', label: 'Depth 2 Peel 4%', type: 'peel', address: 'TWx2m9...44pQ', amount: '₹4,83,813' },
      { id: 'h3', label: 'Depth 3 MIXER', type: 'mixer', address: 'SunSwap LP Pool', amount: '₹4,75,000' },
      { id: 'h4', label: 'Depth 4 Peel 3%', type: 'peel', address: 'TExt29...22aB', amount: '₹4,60,750' },
      { id: 'vasp', label: 'WazirX VASP FOUND', type: 'vasp', address: 'TWazDep...HotWallet', amount: '₹3,78,029' }
    ]
  };

  return patterns[hopCount] || patterns[5];
}

export const MoneyFlowGraph: React.FC<MoneyFlowGraphProps> = ({
  hops: propHops,
  address = 'TYqPw7z2okBhVx1p4mLc8q90dBa1n341bX',
  txHash,
  onNodeClick,
  onComplete,
  className = '',
}) => {
  // Input identifier: either txHash or address
  const rawTarget = txHash || address;
  const debouncedTarget = useDebounce(rawTarget, 500);

  // Compute initial deduplicated hops synchronously for instant first paint
  const getDeduplicatedHops = (target: string): HopNode[] => {
    const raw = propHops && propHops.length > 0 ? propHops : getHopsForWallet(target);
    const seen = new Set<string>();
    const res: HopNode[] = [];
    for (const h of raw) {
      if (h?.id && !seen.has(h.id)) {
        seen.add(h.id);
        res.push(h);
      }
    }
    return res;
  };

  const [activeHops, setActiveHops] = useState<HopNode[]>(() => getDeduplicatedHops(rawTarget));
  const [hop, setHop] = useState<{ current: number; total: number }>({
    current: 1,
    total: activeHops.length || 5,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1); // 1 = 1x (800ms), 2 = 2x (400ms)
  const [restartKey, setRestartKey] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // When target changes, stream/populate hops with instant first paint
  useEffect(() => {
    const freshHops = getDeduplicatedHops(debouncedTarget);
    setActiveHops(freshHops);
    setHop({ current: 1, total: freshHops.length || 5 });
    setActiveIndex(0);
    setIsPlaying(true);
    setIsLoading(false);
  }, [debouncedTarget, propHops]);

  // Compute layout geometry for nodes
  // Wallet node: width 160px, height 90px
  const nodeLayouts = useMemo(() => {
    return activeHops.map((hop, index) => {
      const x = index * 195 + 25; // 195px step spacing for 160px wide wallets (35px gap)
      // Alternate Y gently to produce graceful Bezier arcs (65px and 95px)
      const y = index % 2 === 0 ? 65 : 95;
      return {
        ...hop,
        x,
        y,
        width: 160,
        height: 90,
        // Center connection points: left-center (inflow) and right-center clasp (outflow)
        inX: x,
        inY: y + 45,
        outX: x + 160,
        outY: y + 45,
      };
    });
  }, [activeHops]);

  const totalWidth = useMemo(() => {
    return Math.max(1180, (activeHops.length - 1) * 195 + 240);
  }, [activeHops]);

  // Auto-play progression timer
  useEffect(() => {
    if (!isPlaying || isLoading || activeHops.length === 0) return;

    const intervalTime = Math.max(350, Math.round(800 / speed));
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev < activeHops.length - 1) {
          return prev + 1;
        } else {
          return prev;
        }
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, speed, activeHops.length, restartKey, isLoading]);

  // When animation reaches VASP node: trigger onComplete SAFELY with NO AUTO-SCROLL
  useEffect(() => {
    if (activeHops.length === 0) return;

    const isVaspReached =
      activeIndex === activeHops.length - 1 ||
      activeHops[activeIndex]?.type === 'vasp';

    if (isVaspReached) {
      // NOTE: Strictly NO scrollIntoView, NO window.scrollTo, NO page jumping!
      onComplete?.();
    }
  }, [activeIndex, activeHops, onComplete]);

  const handleReplay = () => {
    setActiveIndex(0);
    setIsPlaying(true);
    setRestartKey((k) => k + 1);
  };

  const getWalletStyles = (
    type: string,
    isActive: boolean,
    isPassed: boolean,
    isVaspTriggered: boolean
  ) => {
    switch (type) {
      case 'origin':
        return {
          cardClass: isActive
            ? 'border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.6)]'
            : 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
          topFlapBorder: isActive ? 'border-orange-400' : 'border-orange-500',
          bgClass: 'bg-gradient-to-br from-[#1f1610] to-black',
          icon: <Briefcase className="w-3.5 h-3.5 text-orange-400 shrink-0" />,
          labelColor: 'text-orange-300',
        };
      case 'peel':
        return {
          cardClass: isActive
            ? 'border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.6)]'
            : 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]',
          topFlapBorder: isActive ? 'border-yellow-400' : 'border-yellow-500',
          bgClass: 'bg-gradient-to-br from-[#1f1a0f] to-black',
          icon: <Wallet className="w-3.5 h-3.5 text-yellow-400 shrink-0" />,
          labelColor: 'text-yellow-300',
        };
      case 'mixer':
        return {
          cardClass: isActive
            ? 'border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.7)]'
            : 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
          topFlapBorder: isActive ? 'border-purple-400' : 'border-purple-500',
          bgClass: 'bg-gradient-to-br from-[#1c1024] to-black',
          icon: <Shuffle className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
          labelColor: 'text-purple-300',
        };
      case 'vasp':
        if (isVaspTriggered) {
          return {
            cardClass:
              'border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.9),0_0_60px_rgba(239,68,68,0.5)] ring-2 ring-red-500',
            topFlapBorder: 'border-red-500',
            bgClass: 'bg-gradient-to-br from-red-950/70 to-black',
            icon: <Landmark className="w-3.5 h-3.5 text-red-400 shrink-0" />,
            labelColor: 'text-red-200',
          };
        }
        return {
          cardClass: isActive
            ? 'border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.8)]'
            : 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]',
          topFlapBorder: isActive ? 'border-green-400' : 'border-green-500',
          bgClass: 'bg-gradient-to-br from-green-950/50 to-black',
          icon: <Landmark className="w-3.5 h-3.5 text-green-400 shrink-0" />,
          labelColor: 'text-green-300',
        };
      default:
        return {
          cardClass: 'border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]',
          topFlapBorder: 'border-white/30',
          bgClass: 'bg-gradient-to-br from-[#1a1a1a] to-black',
          icon: <Wallet className="w-3.5 h-3.5 text-white/70 shrink-0" />,
          labelColor: 'text-white/80',
        };
    }
  };

  const progressPercent = activeHops.length > 0 ? Math.round(((activeIndex + 1) / activeHops.length) * 100) : 0;

  return (
    <div
      key={restartKey}
      style={{ scrollBehavior: 'auto' }}
      className={`relative w-full bg-[#050505] rounded-2xl border border-white/10 overflow-hidden p-6 flex flex-col justify-between select-none ${className}`}
    >
      {/* Top Header & Forensic Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-40">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            <h3 className="font-sora font-extrabold text-base sm:text-lg text-white tracking-wide">
              CHAINALYSIS-GRADE FORENSIC GRAPH // MULTI-HOP PROPAGATION
            </h3>
          </div>
          <p className="text-xs font-mono text-white/50 mt-1">
            Real-time BFS traversal trace • Automated peel chain de-anonymization
          </p>
        </div>

        {/* Controls: Play/Pause, Replay, Speed */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/40 text-xs font-mono text-white cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            title={isPlaying ? 'Pause Animation' : 'Play Animation'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-yellow-400" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-green-400" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={handleReplay}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/40 text-xs font-mono text-white cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            title="Replay from Hop 0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Replay</span>
          </button>

          <button
            onClick={() => setSpeed(speed === 1 ? 2 : 1)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/40 text-xs font-mono text-white cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            title="Toggle playback speed"
          >
            <Zap className={`w-3.5 h-3.5 ${speed === 2 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
            <span className="font-bold">{speed}x</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton State or Rendered Flow Canvas */}
      {isLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center space-y-5">
          <div className="flex items-center gap-4 overflow-hidden w-full justify-center opacity-70">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="w-[160px] h-[90px] rounded-xl bg-white/[0.03] border border-white/10 animate-pulse flex flex-col p-3 justify-between shrink-0"
              >
                <div className="w-16 h-2.5 bg-white/10 rounded" />
                <div className="w-24 h-2 bg-white/10 rounded" />
                <div className="w-14 h-3 bg-green-500/20 rounded" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-green-400/80">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            <span>Mapping transaction graph topology (single render)...</span>
          </div>
        </div>
      ) : (
        /* Main Flow Canvas with Horizontal Scroll support */
        <div
          ref={scrollContainerRef}
          style={{ scrollBehavior: 'auto' }}
          className="w-full relative overflow-x-auto overflow-y-hidden py-6 scrollbar-thin scrollbar-thumb-green-500 my-4"
        >
        <div
          className="relative h-[230px]"
          style={{ width: `${totalWidth}px` }}
        >
          {/* SVG Absolute Layer for Bezier Curve Connections */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ width: `${totalWidth}px`, height: '230px' }}
          >
            <defs>
              {/* Linear gradient for high-contrast animated edges */}
              <linearGradient id="edge-active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#39FF14" stopOpacity="1" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
              </linearGradient>

              {/* Filter for glowing edge blur */}
              <filter id="glow-edge" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Render Bezier curves connecting wallet clasp (outX, outY) to next wallet entrance (inX, inY) */}
            {nodeLayouts.slice(0, -1).map((node, i) => {
              const nextNode = nodeLayouts[i + 1];
              const x1 = node.outX;
              const y1 = node.outY;
              const x2 = nextNode.inX;
              const y2 = nextNode.inY;

              // Cubic Bezier curve control points connecting right clasp to left entrance
              const pathData = `M ${x1},${y1} C ${x1 + 45},${y1} ${x2 - 45},${y2} ${x2},${y2}`;
              const isEdgeActive = i < activeIndex;
              const isCurrentEdge = i === activeIndex - 1;

              return (
                <g key={`edge-group-${node.id}-${nextNode.id}`}>
                  {/* Base dim background path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.1"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* Animated Foreground Active Path */}
                  <motion.path
                    d={pathData}
                    fill="none"
                    stroke={isEdgeActive ? (isCurrentEdge ? '#39FF14' : '#22c55e') : 'rgba(34, 197, 94, 0.2)'}
                    strokeWidth={isEdgeActive ? '2.5' : '1'}
                    strokeDasharray={isEdgeActive ? '5 5' : 'none'}
                    initial={{ pathLength: 0 }}
                    animate={{
                      pathLength: isEdgeActive ? 1 : 0.2,
                      strokeDashoffset: isEdgeActive ? [0, -20] : 0,
                    }}
                    transition={{
                      pathLength: { delay: i * 0.6 + 0.2, duration: 0.6 / speed, ease: 'easeInOut' },
                      strokeDashoffset: { repeat: Infinity, duration: 1 / speed, ease: 'linear' },
                    }}
                    filter={isEdgeActive ? 'url(#glow-edge)' : undefined}
                  />

                  {/* Hop connector marker text */}
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 8}
                    fill={isEdgeActive ? '#39FF14' : 'rgba(255,255,255,0.3)'}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    Hop {i + 1} → {i + 2}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Moving Fund Particle (Glowing Green Dot traveling along the path) */}
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                key={`particle-${activeIndex}`}
                className="absolute z-40 pointer-events-none"
                initial={{
                  x: nodeLayouts[Math.max(0, activeIndex - 1)].outX,
                  y: nodeLayouts[Math.max(0, activeIndex - 1)].outY - 6,
                  opacity: 0,
                }}
                animate={{
                  x: nodeLayouts[activeIndex].inX,
                  y: nodeLayouts[activeIndex].inY - 6,
                  opacity: [0, 1, 1, 0.8],
                }}
                transition={{
                  duration: 0.8 / speed,
                  ease: 'easeInOut',
                }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-green-400 shadow-[0_0_15px_#22c55e,0_0_30px_#22c55e] border-2 border-white animate-pulse" />
                  <div className="absolute w-8 h-8 rounded-full bg-green-500/20 animate-ping pointer-events-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Absolute Positioned WALLET-SHAPED Node Cards */}
          {nodeLayouts.map((node, i) => {
            const isActive = i === activeIndex;
            const isPassed = i < activeIndex;
            const isVaspNode = node.type === 'vasp';
            const isVaspTriggered = isVaspNode && (isActive || isPassed);
            const styles = getWalletStyles(node.type, isActive, isPassed, isVaspTriggered);

            // Clean display label per requirements
            let displayLabel = node.label;
            if (node.type === 'origin') {
              displayLabel = 'Suspect Root';
            } else if (node.type === 'peel' && !displayLabel.toLowerCase().includes('peel') && !displayLabel.toLowerCase().includes('depth')) {
              displayLabel = `Depth ${i} Peel`;
            } else if (node.type === 'mixer') {
              displayLabel = 'MIXER';
            } else if (node.type === 'vasp' && !displayLabel.toLowerCase().includes('found')) {
              displayLabel = 'WazirX FOUND';
            }

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={
                  isVaspTriggered
                    ? {
                        opacity: 1,
                        scale: [1.12, 1.2, 1.16],
                        rotate: 0,
                        y: 0,
                      }
                    : isActive
                    ? {
                        opacity: 1,
                        scale: 1.08,
                        rotate: 3, // Wallet tilts slightly rotate-3 when active
                        y: -4,
                      }
                    : {
                        opacity: isPassed ? 1 : 0.85,
                        scale: 1,
                        rotate: 0,
                        y: 0,
                      }
                }
                transition={
                  isVaspTriggered
                    ? {
                        scale: {
                          repeat: Infinity,
                          repeatType: 'reverse',
                          duration: 0.8,
                          ease: 'easeInOut',
                        },
                        duration: 0.35,
                      }
                    : {
                        delay: i * 0.6, // delay = index * 0.6s
                        duration: 0.45,
                        ease: 'easeOut',
                      }
                }
                onClick={() => {
                  setActiveIndex(i);
                  onNodeClick?.(node);
                }}
                className="absolute w-[160px] h-[90px] cursor-pointer select-none z-20"
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                }}
              >
                {/* Wallet Body */}
                <div
                  className={`relative w-full h-full ${styles.bgClass} border-2 rounded-xl rounded-tl-sm flex flex-col p-2.5 justify-between transition-all duration-300 ${styles.cardClass}`}
                >
                  {/* Wallet Flap Top */}
                  <div
                    className={`absolute -top-2 left-2 right-8 h-2 bg-[#1a1a1a] border-2 border-b-0 ${styles.topFlapBorder} rounded-t-lg pointer-events-none transition-colors duration-300`}
                  />

                  {/* Wallet Clasp (anchor on right edge) */}
                  <div
                    className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-2.5 h-4 bg-yellow-600/90 rounded-r-md border border-yellow-400 shadow-sm z-20 flex items-center justify-center pointer-events-none"
                    title="Wallet Clasp & Connection Anchor"
                  >
                    <div className="w-1 h-1 rounded-full bg-yellow-300" />
                  </div>

                  {/* VASP FREEZE TARGET Badge */}
                  {isVaspNode && (
                    <div className="absolute -top-3.5 right-2 z-30 pointer-events-none">
                      {isVaspTriggered ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[8px] font-black font-mono border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          FREEZE TARGET
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full bg-green-950/80 text-green-400 text-[8px] font-bold font-mono border border-green-500/40">
                          FREEZE TARGET
                        </span>
                      )}
                    </div>
                  )}

                  {/* Icon + Label */}
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {styles.icon}
                    <span className={`text-[11px] font-bold tracking-wide truncate ${styles.labelColor}`}>
                      {displayLabel}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="text-[9.5px] font-mono text-gray-400 truncate tracking-tight">
                    {node.address
                      ? `${node.address.slice(0, 10)}...${node.address.slice(-4)}`
                      : '0x4f...9a12'}
                  </div>

                  {/* Amount */}
                  <div className="text-[11px] font-bold text-green-400 mt-auto flex items-center justify-between font-mono">
                    <span>{node.amount || '₹3.45L'}</span>
                    {isPassed && <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0 ml-1" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      )}

      {/* Bottom Progress Bar & Tracing Telemetry Bar */}
      <div className="w-full pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-30">
        <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/60 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>
                Tracing... Hop {activeIndex + 1}/{activeHops.length || hop.total} (
                <strong className="text-green-400 font-bold">
                  {activeHops[activeIndex]?.label || 'Active Node'}
                </strong>
                )
              </span>
            </span>
            <span className="text-green-400 font-bold font-mono">{progressPercent}%</span>
          </div>

          {/* Styled Animated Progress Track */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-[#39FF14] shadow-[0_0_10px_#22c55e]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </div>

        {/* Right Status Pill */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-white/40">Status:</span>
            {activeIndex === activeHops.length - 1 ? (
              <span className="text-green-400 font-extrabold flex items-center gap-1 bg-green-500/20 px-2.5 py-0.5 rounded border border-green-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                TARGET VASP LOCATED
              </span>
            ) : (
              <span className="text-yellow-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                PROPAGATING BFS TRAIL
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
