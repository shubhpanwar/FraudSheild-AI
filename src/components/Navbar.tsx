import React from 'react';
import {
  ShieldAlert,
  Activity,
  Search,
  GitFork,
  Sliders,
  FileText,
  Zap,
  Play,
  RotateCcw,
} from 'lucide-react';

export type TabId = 'dashboard' | 'transactions' | 'investigation' | 'graph' | 'rules_lab' | 'audit';

interface NavbarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  openCasesCount: number;
  criticalAlertsCount: number;
  onSimulate: (type: 'NORMAL' | 'SYNDICATE_RING') => void;
  isSimulating: boolean;
  onOpenNewTxModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openCasesCount,
  criticalAlertsCount,
  onSimulate,
  isSimulating,
  onOpenNewTxModal,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  FraudShield AI
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v2.4 Core
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Financial Transaction Monitoring &amp; Investigation Platform
              </p>
            </div>
          </div>

          {/* Quick Simulation & Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden lg:flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Pipeline: Active</span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400 font-semibold">{openCasesCount} Cases</span>
              {criticalAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px]">
                  {criticalAlertsCount} Critical
                </span>
              )}
            </div>

            {/* Test Transaction Ingest */}
            <button
              onClick={onOpenNewTxModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Submit a custom transaction to test scoring"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Test Ingest</span>
            </button>

            {/* Attack Ring Injector */}
            <button
              onClick={() => onSimulate('SYNDICATE_RING')}
              disabled={isSimulating}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm shadow-rose-900/30 transition disabled:opacity-50"
              title="Simulate a coordinated syndicate attack across accounts"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Simulate Attack Ring</span>
            </button>

            {/* Benign Traffic Injector */}
            <button
              onClick={() => onSimulate('NORMAL')}
              disabled={isSimulating}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50"
              title="Simulate benign retail payment"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span className="hidden md:inline">+ Normal Tx</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Transaction Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('investigation')}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'investigation'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Investigation Workspace</span>
            {openCasesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                {openCasesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'graph'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitFork className="w-4 h-4 text-cyan-400" />
            <span>Syndicate Network Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('rules_lab')}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'rules_lab'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Rules &amp; ML Engine Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Audit &amp; Compliance Log</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
