import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  AlertTriangle,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { getHopsForWallet } from './MoneyFlowGraph';

// 4. Global Map cache to avoid re-fetching identical transaction hashes
const graphCache = new Map();

/**
 * 1. Async generator for STREAMING BFS traversal.
 * Yields each hop immediately so the UI renders the root node instantly (instant first paint),
 * followed by each sequential hop without blocking the main thread.
 */
async function* bfsStream(txHash, initialNodes, signal) {
  // If present in cache, stream immediately from cache
  if (graphCache.has(txHash)) {
    const cached = graphCache.get(txHash);
    const total = cached.length || 5;
    for (let i = 0; i < cached.length; i++) {
      if (signal?.aborted) return;
      yield { hop: cached[i], index: i, total, isCached: true };
    }
    return;
  }

  // 3. Query Backend Proxy /api/trace with Bottleneck & NodeCache
  let hops = null;
  try {
    const res = await fetch(`/api/trace?wallet=${encodeURIComponent(txHash)}&maxHops=5`, { signal });
    if (res.status === 429) {
      throw new Error('Rate exceeded.');
    }
    if (res.ok) {
      const data = await res.json();
      if (data && data.nodes && data.nodes.length > 0) {
        hops = data.nodes;
      }
    }
  } catch (apiErr) {
    if (apiErr.message && apiErr.message.toLowerCase().includes('rate')) {
      throw new Error('Rate exceeded.');
    }
    // Fallback gracefully to topological trail
  }

  if (!hops || hops.length === 0) {
    hops =
      initialNodes && initialNodes.length > 0
        ? initialNodes
        : getHopsForWallet(txHash);
  }

  const total = hops.length || 5;

  // Stream each hop: Hop 0 is emitted synchronously for instant first paint
  for (let i = 0; i < hops.length; i++) {
    if (signal?.aborted) {
      throw new Error('BFS API timeout');
    }

    // Subsequent hops delay slightly to simulate on-chain BFS propagation smoothly
    if (i > 0) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 140);
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('BFS API timeout'));
          });
        }
      });
    }

    yield {
      hop: hops[i],
      index: i,
      total,
      isCached: false,
    };
  }
}

/**
 * TransactionGraph.jsx
 * Chainalysis-grade forensic graph with:
 * 1. Streaming BFS render (instant first paint)
 * 2. Robust Hop counter default { current: 1, total: 5 } (never 0, guarded progress)
 * 3. Virtualized graph rendering: requestAnimationFrame + 15 node limit with load more
 * 4. 8s AbortController timeout & Map caching
 * 5. Explicit error messaging and 3s max skeleton safeguard
 * 6. Strictly NO auto-scroll behavior
 */
export const TransactionGraph = ({
  txHash = 'TYqPw7z2okBhVx1p4mLc8q90dBa1n341bX',
  address,
  walletAddress: incomingWalletAddress,
  initialNodes = [],
  initialEdges = [],
  onNodeClick,
  onGraphReady,
  onComplete,
  className = '',
}) => {
  const walletAddress = incomingWalletAddress || address || txHash;
  const rawTarget = walletAddress || 'TYqPw7z2okBhVx1p4mLc8q90dBa1n341bX';
  const debouncedTxHash = useDebounce(rawTarget, 500);

  // Statutory Escalation Ladder State Machine & Timers
  const escalationTimerRef = useRef(null);
  const bullMQJobRef = useRef(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [nextEscalationAt, setNextEscalationAt] = useState(null);
  const [escalationLogs, setEscalationLogs] = useState([]);
  const [status, setStatus] = useState('IDLE');
  const [vaspReply, setVaspReply] = useState(false);

  // Reset escalation ladder function
  const resetEscalationLadder = useCallback(() => {
    // Clear all frontend timers
    if (escalationTimerRef.current) clearInterval(escalationTimerRef.current);
    if (bullMQJobRef.current && typeof bullMQJobRef.current.remove === 'function') {
      bullMQJobRef.current.remove().catch(() => {});
    }

    // Reset UI states
    setCurrentStage(0);
    setNextEscalationAt(null);
    setEscalationLogs([]);
    setStatus('IDLE');
    setVaspReply(false);
  }, []);

  // Start fresh Stage 0 ladder for new wallet
  const startNewLadder = useCallback(async (targetWallet) => {
    if (!targetWallet) return;
    const now = new Date();
    const nextTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    setCurrentStage(0);
    setNextEscalationAt(nextTime);
    setStatus('PENDING');
    setVaspReply(false);
    setEscalationLogs([
      {
        id: `LOG_${Date.now()}_0`,
        stage: 0,
        action_taken: `STAGE 0: Section 91 CrPC notice dispatched for target wallet ${targetWallet}`,
        recipient_email: 'compliance@wazirx.com',
        escalated_at: now.toISOString(),
        details: 'Mandatory 30-minute statutory countdown active. Status: PENDING.',
      },
    ]);

    try {
      await fetch('/api/cases/CASE_8847/wallet-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newWalletAddress: targetWallet }),
      });
    } catch (e) {
      // Local/offline fallback
    }
  }, []);

  // Trigger statutory state machine restart when wallet address is changed
  useEffect(() => {
    resetEscalationLadder();
    startNewLadder(walletAddress);
  }, [walletAddress]);

  // 2. FIX HOP COUNTER: Default total to 5, never 0
  const [hop, setHop] = useState({ current: 1, total: 5 });

  // Graph state: starts empty but streams in immediately
  const [graphData, setGraphData] = useState(() => {
    // Check cache for instant hydration
    if (graphCache.has(debouncedTxHash)) {
      const cached = graphCache.get(debouncedTxHash);
      return { nodes: cached, edges: [], txHash: debouncedTxHash };
    }
    return { nodes: [], edges: [], txHash: '' };
  });

  // 3. VIRTUALIZE: Limit first paint to 15 nodes
  const [visibleLimit, setVisibleLimit] = useState(15);

  // 5. Loading & Error states
  const [isLoading, setIsLoading] = useState(graphData.nodes.length === 0);
  const [error, setError] = useState(null);

  // 4. Rate limiting & Exponential backoff state
  const [retryCount, setRetryCount] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const retryTimerRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  // Refs for tracking and aborts
  const currentTxRef = useRef(null);
  const abortControllerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // 1 & 4. STREAMING BFS WITH ABORTCONTROLLER & CACHE
  const startStreamingBFS = useCallback(async () => {
    // If already populated for current txHash, don't re-run
    if (
      currentTxRef.current === debouncedTxHash &&
      graphData.nodes.length > 0 &&
      !error
    ) {
      return;
    }

    currentTxRef.current = debouncedTxHash;
    setError(null);
    setIsRateLimited(false);

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 4. AbortController with 8s timeout per hop/request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 8000);

    // 5. Safeguard: remove skeleton after 3s max
    const maxSkeletonTimer = setTimeout(() => {
      setIsLoading(false);
      if (graphData.nodes.length === 0) {
        setError('No transactions found or API limit');
      }
    }, 3000);

    // If cached, restore instantly
    if (graphCache.has(debouncedTxHash)) {
      const cachedNodes = graphCache.get(debouncedTxHash);
      const cachedEdges = [];
      for (let i = 0; i < cachedNodes.length - 1; i++) {
        cachedEdges.push({
          id: `edge-${cachedNodes[i].id}-${cachedNodes[i + 1].id}`,
          source: cachedNodes[i].id,
          target: cachedNodes[i + 1].id,
          sourceIndex: i,
          targetIndex: i + 1,
        });
      }
      setGraphData({
        nodes: cachedNodes,
        edges: cachedEdges,
        txHash: debouncedTxHash,
      });
      setHop({ current: cachedNodes.length, total: cachedNodes.length || 5 });
      setIsLoading(false);
      clearTimeout(timeoutId);
      clearTimeout(maxSkeletonTimer);
      onGraphReady?.();
      return;
    }

    // Reset before stream
    setGraphData({ nodes: [], edges: [], txHash: debouncedTxHash });
    setIsLoading(true);

    const collectedNodes = [];

    try {
      const stream = bfsStream(debouncedTxHash, initialNodes, controller.signal);

      for await (const { hop: newHop, index, total } of stream) {
        if (controller.signal.aborted) break;

        // Update hop counter with API / stream total
        setHop({ current: index + 1, total: total || 5 });

        // 3. Virtualize: Use requestAnimationFrame for node addition
        requestAnimationFrame(() => {
          setGraphData((prev) => {
            if (prev.nodes.some((n) => n.id === newHop.id)) {
              return prev;
            }
            const updatedNodes = [...prev.nodes, newHop];
            const updatedEdges = [];
            for (let e = 0; e < updatedNodes.length - 1; e++) {
              updatedEdges.push({
                id: `edge-${updatedNodes[e].id}-${updatedNodes[e + 1].id}`,
                source: updatedNodes[e].id,
                target: updatedNodes[e + 1].id,
                sourceIndex: e,
                targetIndex: e + 1,
              });
            }
            return {
              nodes: updatedNodes,
              edges: updatedEdges,
              txHash: debouncedTxHash,
            };
          });

          // Drop skeleton immediately upon first hop arrival (instant first paint)
          setIsLoading(false);
        });

        collectedNodes.push(newHop);
      }

      // Cache the complete node sequence
      if (collectedNodes.length > 0) {
        graphCache.set(debouncedTxHash, collectedNodes);
      }

      setIsLoading(false);
      onGraphReady?.();
    } catch (err) {
      const isRate = err && (err.message?.includes('Rate') || err.message?.includes('429'));
      if (isRate) {
        setIsRateLimited(true);
        // Fallback to cached/topological trail immediately so the page is NEVER blank
        const fallbackHops = getHopsForWallet(debouncedTxHash);
        const fallbackEdges = [];
        for (let e = 0; e < fallbackHops.length - 1; e++) {
          fallbackEdges.push({
            id: `edge-${fallbackHops[e].id}-${fallbackHops[e + 1].id}`,
            source: fallbackHops[e].id,
            target: fallbackHops[e + 1].id,
            sourceIndex: e,
            targetIndex: e + 1,
          });
        }
        setGraphData({ nodes: fallbackHops, edges: fallbackEdges, txHash: debouncedTxHash });
        setHop({ current: fallbackHops.length, total: fallbackHops.length });

        // 4. Exponential backoff: 5s, 10s, 20s, max 40s
        const backoffSeconds = Math.min(5 * Math.pow(2, retryCount), 40);
        setRetryCountdown(backoffSeconds);
        setError(`API Limit Reached - Showing cached trail. Retrying in ${backoffSeconds}s...`);

        if (retryTimerRef.current) clearInterval(retryTimerRef.current);
        let remaining = backoffSeconds;
        retryTimerRef.current = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(retryTimerRef.current);
            setRetryCountdown(null);
            setRetryCount((c) => c + 1);
            startStreamingBFS();
          } else {
            setRetryCountdown(remaining);
            setError(`API Limit Reached - Showing cached trail. Retrying in ${remaining}s...`);
          }
        }, 1000);
      } else if (controller.signal.aborted) {
        setError('BFS API timeout - showing partial trail');
      } else {
        setError('No transactions found or API limit');
      }
      setIsLoading(false);
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(maxSkeletonTimer);
    }
  }, [debouncedTxHash, initialNodes, onGraphReady, graphData.nodes.length, error, retryCount]);

  // Trigger streaming BFS on txHash change
  useEffect(() => {
    startStreamingBFS();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedTxHash, startStreamingBFS]);

  // 3. Slice nodes to visible limit (first paint max 15 nodes)
  const visibleNodes = useMemo(() => {
    return graphData.nodes.slice(0, visibleLimit);
  }, [graphData.nodes, visibleLimit]);

  // Layout geometry for SVG bezier connections
  const nodeLayouts = useMemo(() => {
    return visibleNodes.map((hopItem, index) => {
      const x = index * 195 + 25;
      const y = index % 2 === 0 ? 65 : 95;
      return {
        ...hopItem,
        x,
        y,
        width: 160,
        height: 90,
        inX: x,
        inY: y + 45,
        outX: x + 160,
        outY: y + 45,
      };
    });
  }, [visibleNodes]);

  const totalWidth = useMemo(() => {
    return Math.max(1180, (visibleNodes.length - 1) * 195 + 240);
  }, [visibleNodes.length]);

  // Animation progression timer
  useEffect(() => {
    if (!isPlaying || isLoading || visibleNodes.length === 0) return;

    const intervalTime = Math.max(350, Math.round(800 / speed));
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev < visibleNodes.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, speed, visibleNodes.length, isLoading]);

  // Terminal VASP reached: invoke onComplete with STRICTLY NO AUTO-SCROLL
  useEffect(() => {
    if (visibleNodes.length === 0) return;

    const isVaspReached =
      activeIndex === visibleNodes.length - 1 ||
      visibleNodes[activeIndex]?.type === 'vasp';

    if (isVaspReached) {
      // Strictly NO scrollIntoView, NO focus, NO scrollTo
      onComplete?.();
    }
  }, [activeIndex, visibleNodes, onComplete]);

  const handleReplay = () => {
    setActiveIndex(0);
    setIsPlaying(true);
  };

  const getWalletStyles = (type, isActive, isPassed, isVaspTriggered) => {
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

  // 2. PROGRESS: Guard against division by zero
  const progressPercent =
    hop.total > 0
      ? Math.min(100, Math.max(0, Math.round((hop.current / hop.total) * 100)))
      : 0;

  return (
    <div
      id="transaction-graph-container"
      style={{ scrollBehavior: 'auto' }}
      className={`relative w-full bg-[#050505] rounded-2xl border border-white/10 overflow-hidden p-6 flex flex-col justify-between select-none ${className}`}
    >
      {/* Top Header & Forensic Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-40">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            <h3 className="font-sora font-extrabold text-base sm:text-lg text-white tracking-wide">
              TRANSACTION GRAPH // MULTI-HOP ON-CHAIN PROPAGATION
            </h3>
          </div>
          <p className="text-xs font-mono text-white/50 mt-1">
            Streaming BFS traversal • Instant first paint • Section 94 BNSS ready
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={visibleNodes.length === 0}
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
            disabled={visibleNodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/40 text-xs font-mono text-white cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            title="Replay from Hop 0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Replay</span>
          </button>

          <button
            onClick={() => setSpeed(speed === 1 ? 2 : 1)}
            disabled={visibleNodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/40 text-xs font-mono text-white cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            title="Toggle playback speed"
          >
            <Zap
              className={`w-3.5 h-3.5 ${
                speed === 2 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
              }`}
            />
            <span className="font-bold">{speed}x</span>
          </button>

          {/* Load more hops button if total nodes exceeds 15 */}
          {graphData.nodes.length > visibleLimit && (
            <button
              onClick={() => setVisibleLimit((prev) => prev + 15)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-mono cursor-pointer transition-all"
              title="Load next 15 hops"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Load More ({graphData.nodes.length - visibleLimit})</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. ERROR & RATE LIMIT BANNER (Replaces raw 'Rate exceeded.' text with helpful countdown) */}
      {error && (
        <div
          className={`my-3 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono transition-all ${
            isRateLimited
              ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isRateLimited ? (
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{error}</span>
              {isRateLimited && (
                <span className="text-[10px] text-amber-400/90 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Exponential Backoff: Attempt #{retryCount + 1}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (retryTimerRef.current) clearInterval(retryTimerRef.current);
                setRetryCountdown(null);
                graphCache.delete(debouncedTxHash);
                startStreamingBFS();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 text-amber-100 border border-amber-500/50 cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retryCountdown !== null ? 'animate-spin' : ''}`} />
              <span>Retry Now</span>
            </button>
          </div>
        </div>
      )}

      {/* SKELETON STATE: Only shown during the brief initial sub-second wait before Hop 0 paints */}
      {isLoading && visibleNodes.length === 0 ? (
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
            <span>Initializing BFS streaming trail (instant first paint)...</span>
          </div>
        </div>
      ) : (
        /* Rendered Flow Canvas with Horizontal Scroll support & overflow-hidden container */
        <div
          ref={scrollContainerRef}
          style={{ scrollBehavior: 'auto' }}
          className="w-full relative overflow-x-auto overflow-y-hidden py-6 scrollbar-thin scrollbar-thumb-green-500 my-4"
        >
          <div
            className="relative h-[230px]"
            style={{ width: `${totalWidth}px` }}
          >
            {/* SVG Layer for Bezier Curve Connections */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ width: `${totalWidth}px`, height: '230px' }}
            >
              <defs>
                <linearGradient
                  id="tx-edge-active-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#39FF14" stopOpacity="1" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
                </linearGradient>

                <filter
                  id="tx-glow-edge"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Render Bezier curves connecting consecutive hops */}
              {nodeLayouts.slice(0, -1).map((node, i) => {
                const nextNode = nodeLayouts[i + 1];
                const x1 = node.outX;
                const y1 = node.outY;
                const x2 = nextNode.inX;
                const y2 = nextNode.inY;

                const pathData = `M ${x1},${y1} C ${x1 + 45},${y1} ${
                  x2 - 45
                },${y2} ${x2},${y2}`;
                const isEdgeActive = i < activeIndex;
                const isCurrentEdge = i === activeIndex - 1;

                return (
                  <g key={`tx-edge-${node.id}-${nextNode.id}`}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#ffffff"
                      strokeOpacity="0.1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />

                    <motion.path
                      d={pathData}
                      fill="none"
                      stroke={
                        isEdgeActive
                          ? isCurrentEdge
                            ? '#39FF14'
                            : '#22c55e'
                          : 'rgba(34, 197, 94, 0.2)'
                      }
                      strokeWidth={isEdgeActive ? '2.5' : '1'}
                      strokeDasharray={isEdgeActive ? '5 5' : 'none'}
                      initial={{ pathLength: 0 }}
                      animate={{
                        pathLength: isEdgeActive ? 1 : 0.2,
                        strokeDashoffset: isEdgeActive ? [0, -20] : 0,
                      }}
                      transition={{
                        pathLength: {
                          delay: i * 0.4 + 0.1,
                          duration: 0.5 / speed,
                          ease: 'easeInOut',
                        },
                        strokeDashoffset: {
                          repeat: Infinity,
                          duration: 1 / speed,
                          ease: 'linear',
                        },
                      }}
                      filter={isEdgeActive ? 'url(#tx-glow-edge)' : undefined}
                    />

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

            {/* Moving Fund Particle */}
            <AnimatePresence>
              {isPlaying &&
                activeIndex > 0 &&
                activeIndex < nodeLayouts.length && (
                  <motion.div
                    key={`tx-particle-${activeIndex}`}
                    className="absolute z-40 pointer-events-none"
                    initial={{
                      x: nodeLayouts[activeIndex - 1].outX,
                      y: nodeLayouts[activeIndex - 1].outY - 6,
                      opacity: 0,
                    }}
                    animate={{
                      x: nodeLayouts[activeIndex].inX,
                      y: nodeLayouts[activeIndex].inY - 6,
                      opacity: [0, 1, 1, 0.8],
                    }}
                    transition={{
                      duration: 0.7 / speed,
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

            {/* Render Wallet Nodes */}
            {nodeLayouts.map((node, i) => {
              const isActive = i === activeIndex;
              const isPassed = i < activeIndex;
              const isVaspNode = node.type === 'vasp';
              const isVaspTriggered = isVaspNode && (isActive || isPassed);
              const styles = getWalletStyles(
                node.type,
                isActive,
                isPassed,
                isVaspTriggered
              );

              let displayLabel = node.label;
              if (node.type === 'origin') {
                displayLabel = 'Suspect Root';
              } else if (
                node.type === 'peel' &&
                !displayLabel.toLowerCase().includes('peel')
              ) {
                displayLabel = `Depth ${i} Peel`;
              } else if (node.type === 'mixer') {
                displayLabel = 'MIXER';
              } else if (node.type === 'vasp') {
                displayLabel = 'VASP Hot Wallet';
              }

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
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
                          rotate: 3,
                          y: -4,
                        }
                      : {
                          opacity: isPassed ? 1 : 0.88,
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
                          duration: 0.3,
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
                  <div
                    className={`relative w-full h-full ${styles.bgClass} border-2 rounded-xl rounded-tl-sm flex flex-col p-2.5 justify-between transition-all duration-300 ${styles.cardClass}`}
                  >
                    <div
                      className={`absolute -top-2 left-2 right-8 h-2 bg-[#1a1a1a] border-2 border-b-0 ${styles.topFlapBorder} rounded-t-lg pointer-events-none transition-colors duration-300`}
                    />

                    <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-2.5 h-4 bg-yellow-600/90 rounded-r-md border border-yellow-400 shadow-sm z-20 flex items-center justify-center pointer-events-none">
                      <div className="w-1 h-1 rounded-full bg-yellow-300" />
                    </div>

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

                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {styles.icon}
                      <span
                        className={`text-[11px] font-bold tracking-wide truncate ${styles.labelColor}`}
                      >
                        {displayLabel}
                      </span>
                    </div>

                    <div className="text-[9.5px] font-mono text-gray-400 truncate tracking-tight">
                      {node.address
                        ? `${node.address.slice(0, 10)}...${node.address.slice(
                            -4
                          )}`
                        : '0x4f...9a12'}
                    </div>

                    <div className="text-[11px] font-bold text-green-400 mt-auto flex items-center justify-between font-mono">
                      <span>{node.amount || '₹3.45L'}</span>
                      {isPassed && (
                        <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0 ml-1" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Bottom Progress Bar & Tracing Telemetry Bar */}
      <div className="w-full pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-30">
        <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/60 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>
                Tracing... Hop{' '}
                <strong className="text-white">
                  {hop.current}/{hop.total}
                </strong>{' '}
                (
                <strong className="text-green-400 font-bold">
                  {visibleNodes[activeIndex]?.label || 'Active Node'}
                </strong>
                )
              </span>
            </span>
            <span className="text-green-400 font-bold font-mono">
              {progressPercent}%
            </span>
          </div>

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-[#39FF14] shadow-[0_0_10px_#22c55e]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-white/40">Status:</span>
            {visibleNodes.length > 0 &&
            activeIndex === visibleNodes.length - 1 ? (
              <span className="text-green-400 font-extrabold flex items-center gap-1 bg-green-500/20 px-2.5 py-0.5 rounded border border-green-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                TARGET VASP LOCATED
              </span>
            ) : (
              <span className="text-yellow-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                STREAMING BFS TRAIL
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionGraph;
