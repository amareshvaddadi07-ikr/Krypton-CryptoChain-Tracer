import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomNode } from './CustomNode';
import { TravelingDotEdge } from './TravelingDotEdge';
import { ShieldAlert, Layers, Map as MapIcon, Maximize2 } from 'lucide-react';

const nodeTypes = {
  customNode: CustomNode,
  scammer: CustomNode,
  layer: CustomNode,
  vasp: CustomNode,
  exchange: CustomNode,
  mixer: CustomNode,
  dex: CustomNode,
};

const edgeTypes = {
  travelingDotEdge: TravelingDotEdge,
  default: TravelingDotEdge,
};

interface GraphCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  title?: string;
  chain?: string;
  wallet?: string;
  amount?: number | string;
  firstLayerWallet?: string;
  vaspName?: string;
  hops?: number;
  isDeep?: boolean;
  peelingCount?: number;
  scanKey?: number;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  initialNodes,
  initialEdges,
  title = 'KRYPTON FLOW // 9 HOPS TO FREEZE',
  chain: _chain = 'TRON',
  wallet: _wallet = 'TQa9...',
  amount: _amount = '₹2,24,034',
  firstLayerWallet: _firstLayerWallet = 'TJb8...3kL',
  vaspName: _vaspName = 'WazirX',
  hops = 2,
  isDeep = false,
  peelingCount = 0,
  scanKey = 0,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showGreenVignette, setShowGreenVignette] = useState<boolean>(false);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true);

  // Progressive graph reveal
  const startLiveAnimation = useCallback(() => {
    if (!initialNodes || initialNodes.length === 0) return;

    setIsScreenShaking(false);

    // Step 0: Suspect Wallet (Node 0)
    setNodes([initialNodes[0]]);
    setEdges([]);

    const totalHops = initialNodes.length - 1;
    const timeouts: NodeJS.Timeout[] = [];
    const hopDelay = isDeep || totalHops > 4 ? 500 : 580;

    for (let i = 1; i < initialNodes.length; i++) {
      const isLast = i === initialNodes.length - 1;
      const targetNode = initialNodes[i];
      const targetEdge = initialEdges[i - 1];
      const delay = 350 + i * hopDelay;

      const t = setTimeout(() => {
        // Check if mixer node to trigger screen shake
        const nodeCategory = (targetNode.data as any)?.category || targetNode.type;
        if (nodeCategory === 'mixer' || (targetNode.data as any)?.isMixer) {
          setIsScreenShaking(true);
          setTimeout(() => setIsScreenShaking(false), 450);
        }

        // Reveal next edge
        if (targetEdge) {
          setEdges((prev) => {
            if (!prev.some((e) => e.id === targetEdge.id)) {
              return [...prev, targetEdge];
            }
            return prev;
          });
        }

        // Reveal next node
        setNodes((prev) => {
          const map = new Map(prev.map((n) => [n.id, n]));
          const existing = initialNodes.slice(0, i).map((n) => map.get(n.id) || n);
          return [...existing, targetNode];
        });

        // Terminus green vignette flash
        if (isLast) {
          setShowGreenVignette(true);
          setTimeout(() => setShowGreenVignette(false), 240);
        }
      }, delay);

      timeouts.push(t);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [initialNodes, initialEdges, isDeep]);

  useEffect(() => {
    const cleanup = startLiveAnimation();
    return () => {
      cleanup?.();
    };
  }, [scanKey, initialNodes, startLiveAnimation]);

  const displayTitle = title === 'MONEY FLOW // HOPS TO FREEZE'
    ? `KRYPTON FLOW // ${hops} HOPS TO FREEZE`
    : title;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={
        isScreenShaking
          ? {
              x: [-6, 6, -5, 5, -3, 3, 0],
              y: [-2, 2, -1, 1, 0],
              opacity: 1,
              scale: 1,
            }
          : { x: 0, y: 0, opacity: 1, scale: 1 }
      }
      transition={{
        duration: isScreenShaking ? 0.45 : 0.35,
        type: isScreenShaking ? 'tween' : 'spring',
        stiffness: 260,
        damping: 20,
      }}
      className="w-full h-full min-h-[500px] flex flex-col rounded-3xl overflow-hidden bg-[#0A110A]/80 border border-[#39FF14]/20 backdrop-blur-xl relative z-10 shadow-[0_0_30px_rgba(57,255,20,0.06),inset_0_1px_1px_rgba(57,255,20,0.1)]"
    >
      {/* 0.2s Green Vignette Screen Flash when VASP Node appears */}
      <AnimatePresence>
        {showGreenVignette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 pointer-events-none z-[9999] shadow-[inset_0_0_140px_rgba(57,255,20,0.75)] bg-[#39FF14]/10 backdrop-contrast-125"
          />
        )}
      </AnimatePresence>

      {/* Graph Header */}
      <div className="px-4 py-3 border-b border-[#39FF14]/15 flex items-center justify-between bg-[#050805]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]" />
          <span className="text-[10px] font-mono text-[#F0FFF0]/70 tracking-widest uppercase font-semibold">
            {displayTitle}
          </span>
          {peelingCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14] text-[9.5px] font-mono font-bold">
              <Layers className="w-3 h-3 text-[#39FF14]" />
              <span>{peelingCount} PEEL HOPS</span>
            </div>
          )}
          {isDeep && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#9D00FF]/20 border border-[#9D00FF]/50 text-[#B026FF] text-[9.5px] font-mono font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B026FF] shadow-[0_0_6px_#B026FF]" />
              <span>DEEP TRACE ({hops} HOPS)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* MiniMap Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMiniMap((prev) => !prev)}
            title={showMiniMap ? 'Hide MiniMap' : 'Show MiniMap'}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-all border ${
              showMiniMap
                ? 'bg-[#39FF14]/15 text-[#39FF14] border-[#39FF14]/40 hover:bg-[#39FF14]/25 shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                : 'bg-[#0A110A] text-[#8BA88B] border-[#39FF14]/15 hover:text-white hover:bg-[#39FF14]/10'
            }`}
          >
            <MapIcon className="w-3 h-3" />
            <span>{showMiniMap ? 'MINIMAP ON' : 'MINIMAP OFF'}</span>
          </button>
          <div className="w-2 h-2 rounded-full bg-[#39FF14]/30" />
          <div className="w-2 h-2 rounded-full bg-[#9D00FF]/40" />
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="w-full flex-1 relative min-h-[500px] bg-[#0A110A] overflow-hidden z-10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, duration: 800 }}
          defaultViewport={{ zoom: 0.7, x: 0, y: 0 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.25}
          maxZoom={1.5}
        >
          <Background
            color="rgba(57, 255, 20, 0.08)"
            gap={20}
            size={1}
            variant={BackgroundVariant.Dots}
          />
          <Controls
            showFitView={true}
            showZoom={true}
            showInteractive={true}
            fitViewOptions={{ padding: 0.2, duration: 800 }}
            position="bottom-right"
            className="!m-3"
          />
          {/* MiniMap for horizontal navigation */}
          {showMiniMap && (
            <MiniMap
              position="bottom-left"
              nodeColor={(n: any) => {
                const category = n.data?.category || n.type;
                if (category === 'exchange' || n.type === 'vasp' || n.data?.isTarget) return '#FF00A8';
                if (category === 'mixer' || n.type === 'mixer') return '#9D00FF';
                if (category === 'dex' || n.type === 'dex') return '#00FF88';
                if (category === 'scammer' || n.id === '0') return '#39FF14';
                return '#7FFF67';
              }}
              maskColor="rgba(5, 8, 5, 0.88)"
              className="!bg-[#050805]/90 !border !border-[#39FF14]/30 !rounded-xl !overflow-hidden !m-3 !shadow-[0_8px_24px_rgba(0,0,0,0.85)] hidden md:block"
              zoomable
              pannable
            />
          )}
        </ReactFlow>
      </div>

      {/* Bottom status strip */}
      <div className="px-4 py-2.5 bg-[#050805]/95 border-t border-[#39FF14]/15 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#8BA88B]">
        <div className="flex items-center gap-2">
          <span className="text-[#39FF14] font-bold">SOURCE ROOT</span>
          <span>→</span>
          <span className="text-[#7FFF67]">MULE LAYERS</span>
          {isDeep && (
            <>
              <span>→</span>
              <span className="text-[#9D00FF]">MIXER</span>
              <span>/</span>
              <span className="text-[#00FF88]">DEX</span>
            </>
          )}
          <span>→</span>
          <span className="text-[#FF00A8] font-bold">TERMINUS: VASP</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#39FF14] font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-[#39FF14]" />
          <span>INSTANT FREEZE ELIGIBLE (91 CrPC / 94 BNSS)</span>
        </div>
      </div>
    </motion.div>
  );
};
