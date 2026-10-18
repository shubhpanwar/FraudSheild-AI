import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Layers,
  Sparkles,
  ArrowRight,
  Cpu,
  Brain,
  Share2,
} from 'lucide-react';
import type { DashboardSummary, Transaction, RiskAssessment } from '../types/fraud.ts';

interface DashboardOverviewProps {
  summary: DashboardSummary | null;
  recentFlaggedTransactions: { tx: Transaction; assessment: RiskAssessment }[];
  onSelectTransaction: (txId: string) => void;
  onNavigateTab: (tab: 'transactions' | 'investigation' | 'graph' | 'rules_lab') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  summary,
  recentFlaggedTransactions,
  onSelectTransaction,
  onNavigateTab,
}) => {
  if (!summary) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalVolume = summary.totalTransactions24h || 1;
  const criticalPct = Math.round((summary.riskDistribution.critical / totalVolume) * 100);
  const highPct = Math.round((summary.riskDistribution.high / totalVolume) * 100);
  const mediumPct = Math.round((summary.riskDistribution.medium / totalVolume) * 100);
  const lowPct = Math.max(0, 100 - (criticalPct + highPct + mediumPct));

  return (
    <div className="space-y-6">
      {/* Platform Architecture Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4 sm:p-5 border border-slate-700/60 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Triple-Layer Defense Architecture
              </span>
              <span className="text-slate-400 text-xs">Deterministic + Probabilistic + Generative</span>
            </div>
            <h2 className="text-lg font-semibold text-white">
              Intelligent Financial Monitoring &amp; Decisioning
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Every simulated payment passes through deterministic rules, an ML risk estimator,
              and evidence-grounded AI explanation before analyst case resolution.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center space-x-2 bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800 text-xs">
              <Cpu className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Layer 1: Rules</p>
                <p className="font-semibold text-slate-200">Velocity &amp; Baseline</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800 text-xs">
              <Brain className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Layer 2: ML Model</p>
                <p className="font-semibold text-slate-200">FraudXGB v2.4</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800 text-xs">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Layer 3: GenAI</p>
                <p className="font-semibold text-slate-200">Gemini 3.8 Flash</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Ingested */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>24h Ingested</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{summary.totalTransactions24h}</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center">
            <TrendingUp className="w-3 h-3 text-emerald-400 mr-1" />
            Live streaming
          </p>
        </div>

        {/* Total Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Value</span>
            <span className="text-xs font-semibold text-slate-500">USD</span>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            ${summary.totalAmountProcessed.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Settled &amp; pending</p>
        </div>

        {/* Flagged Cases */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Flagged for Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 tracking-tight">{summary.flaggedTransactionsCount}</p>
          <p className="text-[11px] text-amber-300/80 mt-1">Requires human analyst</p>
        </div>

        {/* Blocked Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-rose-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Critical Blocked</span>
            <Ban className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 tracking-tight">{summary.blockedTransactionsCount}</p>
          <p className="text-[11px] text-rose-300/80 mt-1">Score ≥ 85 auto-halt</p>
        </div>

        {/* Fraud Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Gross Fraud Rate</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{summary.fraudRatePercent}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Flagged / total ratio</p>
        </div>

        {/* Active Syndicates */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-cyan-500/30 transition cursor-pointer"
          onClick={() => onNavigateTab('graph')}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Syndicate Rings</span>
            <Share2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400 tracking-tight">{summary.activeSyndicatesCount}</p>
          <p className="text-[11px] text-cyan-300/80 mt-1 flex items-center">
            Shared device rings <ArrowRight className="w-3 h-3 ml-0.5" />
          </p>
        </div>
      </div>

      {/* Middle Section: Hourly Spikes Chart & Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Volume vs Spikes Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Hourly Transaction Volume &amp; Fraud Spikes</h3>
              <p className="text-xs text-slate-400">Normal volume vs flagged transactions (UTC)</p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
                <span>Total Tx</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
                <span>Flagged Spikes</span>
              </span>
            </div>
          </div>

          {/* Simple Clean Responsive Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-800 pb-2">
            {summary.hourlyTrends.map((trend, idx) => {
              const maxVal = 35;
              const totalHeight = Math.min(100, Math.round((trend.total / maxVal) * 100));
              const flaggedHeight = Math.min(100, Math.round((trend.flagged / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    {/* Total Bar */}
                    <div
                      className="w-1/2 bg-blue-500/70 hover:bg-blue-500 rounded-t transition-all relative"
                      style={{ height: `${totalHeight}%` }}
                      title={`${trend.hour}: ${trend.total} total transactions`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                        {trend.total}
                      </span>
                    </div>

                    {/* Flagged Bar */}
                    <div
                      className="w-1/2 bg-rose-500 hover:bg-rose-400 rounded-t transition-all relative"
                      style={{ height: `${flaggedHeight}%` }}
                      title={`${trend.hour}: ${trend.flagged} flagged transactions`}
                    >
                      {trend.flagged > 0 && (
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-900 text-rose-200 text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                          {trend.flagged}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{trend.hour}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-3">
            <span>Noticeable 02:00 UTC anomaly: Credential stuffing &amp; syndicate burst on shared device DEV-204</span>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center"
            >
              Inspect Feed <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>

        {/* Risk Score Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Risk Band Distribution</h3>
                <p className="text-xs text-slate-400">Breakdown of assessed payments</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Avg: {summary.avgRiskScore}/100
              </span>
            </div>

            {/* Stacked Percentage Bar */}
            <div className="h-4 rounded-full overflow-hidden flex bg-slate-800 mb-6">
              <div style={{ width: `${criticalPct}%` }} className="bg-rose-600" title={`Critical: ${summary.riskDistribution.critical}`} />
              <div style={{ width: `${highPct}%` }} className="bg-amber-500" title={`High: ${summary.riskDistribution.high}`} />
              <div style={{ width: `${mediumPct}%` }} className="bg-yellow-500" title={`Medium: ${summary.riskDistribution.medium}`} />
              <div style={{ width: `${lowPct}%` }} className="bg-emerald-500" title={`Low: ${summary.riskDistribution.low}`} />
            </div>

            {/* Breakdown Legend */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-slate-200 font-medium">Critical (80 - 100)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">{summary.riskDistribution.critical}</span>
                  <span className="text-slate-400 text-[10px]">({criticalPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-200 font-medium">High (60 - 79)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">{summary.riskDistribution.high}</span>
                  <span className="text-slate-400 text-[10px]">({highPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <span className="text-slate-200 font-medium">Medium (35 - 59)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">{summary.riskDistribution.medium}</span>
                  <span className="text-slate-400 text-[10px]">({mediumPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-200 font-medium">Low (0 - 34)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">{summary.riskDistribution.low}</span>
                  <span className="text-slate-400 text-[10px]">({lowPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Configurable policy score bands</span>
            <button
              onClick={() => onNavigateTab('rules_lab')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Tune Weights →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Flagged Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white">High Priority Flagged Transactions</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-400">Top transactions crossing risk threshold (Score &ge; 65)</p>
          </div>
          <button
            onClick={() => onNavigateTab('investigation')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition flex items-center space-x-1"
          >
            <span>Open Investigation Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Hardware / Device</th>
                <th className="py-2.5 px-3 text-center">Rule Score</th>
                <th className="py-2.5 px-3 text-center">ML Score</th>
                <th className="py-2.5 px-3 text-center">Combined</th>
                <th className="py-2.5 px-3">Top Risk Signal</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentFlaggedTransactions.slice(0, 6).map(({ tx, assessment }) => {
                const isCritical = assessment.riskLevel === 'CRITICAL';
                const topSignal = assessment.signals[0];

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => onSelectTransaction(tx.id)}
                  >
                    <td className="py-3 px-3 font-mono font-semibold text-blue-400 group-hover:underline">
                      {tx.id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200">{tx.accountId}</div>
                      <div className="text-[10px] text-slate-400">{tx.accountName || 'Customer'}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-white">
                      ${tx.amount.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">{tx.currency}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize text-slate-300">{tx.merchantCategory.replace('_', ' ')}</span>
                      <div className="text-[10px] text-slate-400">{tx.merchantName}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      <span className={tx.deviceId === 'DEV-204' ? 'text-amber-400 font-semibold' : ''}>
                        {tx.deviceId}
                      </span>
                      {tx.deviceId === 'DEV-204' && (
                        <span className="ml-1 text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded">
                          RING
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-amber-300">
                      {assessment.ruleScore}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-purple-300">
                      {assessment.modelScore}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {assessment.combinedScore}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-slate-300">
                      <span className="font-medium text-slate-200">
                        {topSignal?.name || 'Anomalous Activity'}
                      </span>
                      <div className="text-[10px] text-slate-400 truncate">{topSignal?.evidence}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(tx.id);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition text-[11px] font-medium"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
