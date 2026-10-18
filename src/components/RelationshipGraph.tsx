import React, { useState, useMemo } from 'react';
import {
  GitFork,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldAlert,
  Smartphone,
  User,
  Building,
  Globe,
  DollarSign,
  AlertOctagon,
  Info,
} from 'lucide-react';
import type { NetworkGraphData, GraphNode, GraphLink } from '../types/fraud.ts';

interface RelationshipGraphProps {
  graphData: NetworkGraphData | null;
  onSelectTransaction: (txId: string) => void;
  selectedEntityId?: string;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  graphData,
  onSelectTransaction,
  selectedEntityId,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'SYNDICATE_ONLY' | 'FLAGGED_ONLY'>('ALL');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(selectedEntityId || null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Compute node coordinates deterministically in a visually balanced layout
  const layout = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    let filteredNodes = [...graphData.nodes];
    let filteredLinks = [...graphData.links];

    if (filterMode === 'SYNDICATE_ONLY') {
      // Focus on DEV-204 syndicate ring
      const syndicateNodeIds = new Set([
        'dev:DEV-204',
        'ip:198.51.100.44',
        'acc:ACC-1007',
        'acc:ACC-2041',
        'acc:ACC-3108',
        'acc:ACC-4092',
        'tx:TXN-9001',
        'tx:TXN-9002',
        'tx:TXN-9003',
        'tx:TXN-9004',
        'merch:Apex_Electronics_Direct',
        'merch:BitNexus_Prime_Exchange',
        'merch:RemitFlow_International',
        'merch:Grand_Jewelers_Geneva',
      ]);
      filteredNodes = filteredNodes.filter((n) => syndicateNodeIds.has(n.id));
      filteredLinks = filteredLinks.filter(
        (l) => syndicateNodeIds.has(l.source) && syndicateNodeIds.has(l.target)
      );
    } else if (filterMode === 'FLAGGED_ONLY') {
      filteredNodes = filteredNodes.filter(
        (n) => n.isFlagged || n.type === 'DEVICE' || n.type === 'ACCOUNT'
      );
      const validIds = new Set(filteredNodes.map((n) => n.id));
      filteredLinks = filteredLinks.filter(
        (l) => validIds.has(l.source) && validIds.has(l.target)
      );
    }

    // Circular multi-tier layout:
    // Center: Shared Devices (DEV-204, etc.)
    // Inner Ring: Accounts
    // Middle Ring: Transactions
    // Outer Ring: Merchants & IPs
    const width = 900;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;

    const positionedNodes = filteredNodes.map((node, idx) => {
      let x = centerX;
      let y = centerY;

      if (node.id === 'dev:DEV-204') {
        // High-profile ring center
        x = centerX;
        y = centerY - 10;
      } else if (node.type === 'DEVICE') {
        const angle = (idx / filteredNodes.length) * 2 * Math.PI;
        x = centerX + Math.cos(angle) * 70;
        y = centerY + Math.sin(angle) * 60;
      } else if (node.type === 'ACCOUNT') {
        const accounts = filteredNodes.filter((n) => n.type === 'ACCOUNT');
        const accIdx = accounts.findIndex((a) => a.id === node.id);
        const angle = (accIdx / (accounts.length || 1)) * 2 * Math.PI;
        x = centerX + Math.cos(angle) * 160;
        y = centerY + Math.sin(angle) * 140;
      } else if (node.type === 'TRANSACTION') {
        const txs = filteredNodes.filter((n) => n.type === 'TRANSACTION');
        const txIdx = txs.findIndex((t) => t.id === node.id);
        const angle = (txIdx / (txs.length || 1)) * 2 * Math.PI;
        x = centerX + Math.cos(angle) * 260;
        y = centerY + Math.sin(angle) * 200;
      } else if (node.type === 'MERCHANT') {
        const merchs = filteredNodes.filter((n) => n.type === 'MERCHANT');
        const mIdx = merchs.findIndex((m) => m.id === node.id);
        const angle = (mIdx / (merchs.length || 1)) * 2 * Math.PI + 0.3;
        x = centerX + Math.cos(angle) * 350;
        y = centerY + Math.sin(angle) * 230;
      } else {
        // IP
        const ips = filteredNodes.filter((n) => n.type === 'IP');
        const ipIdx = ips.findIndex((i) => i.id === node.id);
        const angle = (ipIdx / (ips.length || 1)) * 2 * Math.PI - 0.4;
        x = centerX + Math.cos(angle) * 370;
        y = centerY + Math.sin(angle) * 240;
      }

      return {
        ...node,
        x,
        y,
      };
    });

    const nodeCoords = new Map(positionedNodes.map((n) => [n.id, { x: n.x, y: n.y }]));

    const mappedLinks = filteredLinks
      .map((l) => {
        const sourceCoord = nodeCoords.get(l.source);
        const targetCoord = nodeCoords.get(l.target);
        if (!sourceCoord || !targetCoord) return null;
        return {
          ...l,
          x1: sourceCoord.x,
          y1: sourceCoord.y,
          x2: targetCoord.x,
          y2: targetCoord.y,
        };
      })
      .filter(Boolean);

    return {
      nodes: positionedNodes,
      links: mappedLinks as any[],
    };
  }, [graphData, filterMode]);

  const activeNode = activeNodeId
    ? layout.nodes.find((n) => n.id === activeNodeId)
    : null;

  return (
    <div className="space-y-4">
      {/* Top Banner and Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-white">Suspicious Relationship &amp; Entity Network</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Coordinated Ring Visualizer
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Uncovers hidden rings across customer accounts, shared hardware devices, IP blocks, and merchant entities.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {/* Preset Filter Modes */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex space-x-1">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                filterMode === 'ALL'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Graph
            </button>
            <button
              onClick={() => setFilterMode('SYNDICATE_ONLY')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                filterMode === 'SYNDICATE_ONLY'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Syndicate Ring (DEV-204)
            </button>
            <button
              onClick={() => setFilterMode('FLAGGED_ONLY')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                filterMode === 'FLAGGED_ONLY'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Flagged Only
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-slate-400 hover:text-white"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas + Entity Inspector Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* SVG Canvas Area */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden h-[560px] shadow-inner flex items-center justify-center">
          {/* Legend Overlay */}
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-[11px] space-y-1.5 z-10 pointer-events-none">
            <span className="font-bold text-slate-300 block mb-1">Entity Types</span>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-slate-300">Account (ACC)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-300">Device Hardware</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-rose-300 font-medium">Shared Ring Device</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Merchant</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span className="text-slate-300">IP Node</span>
            </div>
          </div>

          <svg
            viewBox="0 0 900 550"
            className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="900" height="550" fill="url(#grid)" />

            {/* Links / Edges */}
            <g>
              {layout.links.map((link, idx) => {
                const isSelected =
                  link.source === activeNodeId || link.target === activeNodeId;

                return (
                  <line
                    key={idx}
                    x1={link.x1}
                    y1={link.y1}
                    x2={link.x2}
                    y2={link.y2}
                    stroke={
                      link.isSuspicious
                        ? '#f43f5e'
                        : isSelected
                        ? '#38bdf8'
                        : '#334155'
                    }
                    strokeWidth={link.isSuspicious ? 2.5 : isSelected ? 2 : 1}
                    strokeDasharray={link.isSuspicious ? '4,3' : undefined}
                    opacity={isSelected ? 1 : 0.65}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {layout.nodes.map((node) => {
                const isSelected = node.id === activeNodeId;
                const isSharedRing = node.id === 'dev:DEV-204';

                let fill = '#3b82f6';
                if (node.type === 'DEVICE') fill = isSharedRing ? '#e11d48' : '#f59e0b';
                else if (node.type === 'MERCHANT') fill = '#10b981';
                else if (node.type === 'IP') fill = '#a855f7';
                else if (node.type === 'TRANSACTION') fill = node.isFlagged ? '#e11d48' : '#0284c7';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setActiveNodeId(node.id)}
                    className="cursor-pointer group"
                  >
                    {/* Ring highlight glow if shared syndicate */}
                    {isSharedRing && (
                      <circle
                        r="24"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2"
                        className="animate-ping opacity-75"
                      />
                    )}

                    {/* Node circle */}
                    <circle
                      r={isSharedRing ? 20 : node.type === 'TRANSACTION' ? 14 : 17}
                      fill={fill}
                      stroke={isSelected ? '#ffffff' : '#0f172a'}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all hover:scale-110"
                    />

                    {/* Node Text Label */}
                    <text
                      y={node.type === 'TRANSACTION' ? 24 : 28}
                      textAnchor="middle"
                      fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                      fontSize={node.type === 'TRANSACTION' ? '9' : '10'}
                      fontWeight={isSelected || isSharedRing ? 'bold' : 'normal'}
                      className="pointer-events-none select-none"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Entity Inspector
            </span>
            <h4 className="text-base font-bold text-white font-mono truncate">
              {activeNode ? activeNode.label : 'Select Any Node'}
            </h4>
          </div>

          {activeNode ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Entity Class</span>
                <p className="font-semibold text-slate-200">{activeNode.type}</p>
                <p className="text-[11px] text-slate-400">{activeNode.subtitle || 'Active Cluster Node'}</p>
              </div>

              {activeNode.id === 'dev:DEV-204' && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
                    <AlertOctagon className="w-4 h-4" />
                    <span>Active Syndicate Hub</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This Windows desktop fingerprint is simultaneously routing transactions across 4 customer
                    identities (ACC-1007, ACC-2041, ACC-3108, ACC-4092) within minutes.
                  </p>
                </div>
              )}

              {/* Connected Links from this Node */}
              <div>
                <p className="font-semibold text-slate-300 mb-2">Connected Relationships:</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {layout.links
                    .filter((l) => l.source === activeNode.id || l.target === activeNode.id)
                    .map((l, i) => (
                      <div
                        key={i}
                        className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between"
                      >
                        <span className="text-slate-400">{l.label}</span>
                        <span className="font-mono text-slate-200">
                          {l.source === activeNode.id ? l.target : l.source}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* If it's a transaction, allow direct jump to investigation */}
              {activeNode.type === 'TRANSACTION' && (
                <button
                  onClick={() => onSelectTransaction(activeNode.id.replace('tx:', ''))}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition text-xs flex items-center justify-center space-x-1"
                >
                  <span>Investigate Payment</span>
                </button>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <Info className="w-6 h-6 text-slate-600 mx-auto" />
              <p>Click any account, device, merchant or transaction node to inspect its graph connections.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
