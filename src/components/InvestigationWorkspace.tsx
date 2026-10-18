import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  Brain,
  Cpu,
  Sparkles,
  User,
  Smartphone,
  Globe,
  CreditCard,
  Building,
  CheckCircle,
  AlertOctagon,
  Clock,
  ArrowRight,
  Send,
  HelpCircle,
  RefreshCw,
  GitFork,
  MessageSquare,
  Lock,
} from 'lucide-react';
import type {
  Transaction,
  RiskAssessment,
  FraudCase,
  CaseStatus,
  AIExplanation,
} from '../types/fraud.ts';

interface InvestigationWorkspaceProps {
  transaction: Transaction | null;
  assessment: RiskAssessment | null;
  fraudCase: FraudCase | null;
  allTransactions: Transaction[];
  onUpdateCaseStatus: (caseId: string, status: CaseStatus, resolution?: string) => Promise<void>;
  onAddCaseNote: (caseId: string, content: string) => Promise<void>;
  onGenerateAIExplanation: (transactionId: string) => Promise<AIExplanation | null>;
  onNavigateToGraph: (entityId?: string) => void;
  onSelectTransaction: (txId: string) => void;
}

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  transaction,
  assessment,
  fraudCase,
  allTransactions,
  onUpdateCaseStatus,
  onAddCaseNote,
  onGenerateAIExplanation,
  onNavigateToGraph,
  onSelectTransaction,
}) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!transaction || !assessment) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
        <HelpCircle className="w-10 h-10 text-slate-500 mx-auto" />
        <h3 className="text-base font-semibold text-white">No Transaction Selected for Investigation</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please select a flagged payment from the Overview Dashboard or Transaction Feed to open its deep-dive investigation workspace.
        </p>
      </div>
    );
  }

  // Cross-account device sharing detection
  const otherTxsWithSameDevice = allTransactions.filter(
    (t) => t.deviceId === transaction.deviceId && t.id !== transaction.id
  );
  const uniqueAccountsOnDevice = Array.from(
    new Set(allTransactions.filter((t) => t.deviceId === transaction.deviceId).map((t) => t.accountId))
  );
  const isSyndicateRing = uniqueAccountsOnDevice.length >= 2;

  // Account prior transactions
  const accountHistory = allTransactions.filter(
    (t) => t.accountId === transaction.accountId && t.id !== transaction.id
  );

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      await onGenerateAIExplanation(transaction.id);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleStatusChange = async (newStatus: CaseStatus) => {
    if (!fraudCase) return;
    setIsUpdatingStatus(true);
    try {
      await onUpdateCaseStatus(fraudCase.id, newStatus, selectedResolution || undefined);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fraudCase || !newNoteContent.trim()) return;
    setIsSubmittingNote(true);
    try {
      await onAddCaseNote(fraudCase.id, newNoteContent.trim());
      setNewNoteContent('');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const isCritical = assessment.riskLevel === 'CRITICAL';
  const isHigh = assessment.riskLevel === 'HIGH';

  return (
    <div className="space-y-6">
      {/* Top Banner: Transaction & Case Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {transaction.id}
              </span>
              {fraudCase && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {fraudCase.id}
                </span>
              )}
              <span className="text-slate-400 text-xs">Channel: {transaction.channel}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-xs">UTC: {new Date(transaction.timestamp).toLocaleString()}</span>
            </div>

            <div className="flex items-baseline space-x-3 pt-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                ${transaction.amount.toFixed(2)}{' '}
                <span className="text-sm font-normal text-slate-400">{transaction.currency}</span>
              </h2>
              <span className="text-xs text-slate-300">at {transaction.merchantName}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                {transaction.merchantCategory.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Combined Score Gauge & Badges */}
          <div className="flex items-center space-x-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Rule Score</span>
              <span className="text-lg font-bold font-mono text-amber-400">{assessment.ruleScore}</span>
            </div>
            <div className="text-slate-700">|</div>
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ML Score</span>
              <span className="text-lg font-bold font-mono text-purple-400">{assessment.modelScore}</span>
            </div>
            <div className="text-slate-700">|</div>
            <div className="text-center px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Combined Risk</span>
              <div className="flex items-center justify-center space-x-1.5">
                <span
                  className={`text-2xl font-black font-mono ${
                    isCritical ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {assessment.combinedScore}
                </span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
            </div>
            <div className="space-y-1">
              <span
                className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  isCritical
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : isHigh
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {assessment.riskLevel}
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Status: {assessment.status}</p>
            </div>
          </div>
        </div>

        {/* Coordinated Syndicate Warning if Shared Device */}
        {isSyndicateRing && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>
                <strong className="font-semibold text-white">Syndicate Ring Detected:</strong> Device{' '}
                <code className="px-1 py-0.5 bg-rose-900/60 rounded font-mono text-white">{transaction.deviceId}</code> is
                co-utilized across <strong>{uniqueAccountsOnDevice.length} distinct customer accounts</strong> (
                {uniqueAccountsOnDevice.join(', ')}).
              </span>
            </div>
            <button
              onClick={() => onNavigateToGraph(transaction.deviceId)}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold transition text-xs whitespace-nowrap ml-3 inline-flex items-center space-x-1"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Inspect in Graph</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid: 3-Layer Evidence & Scoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Layer 1: Rules Engine Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Layer 1: Rules Engine Signals</h3>
                <p className="text-xs text-slate-400">Deterministic conditions &amp; baseline deviations</p>
              </div>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">
              Rule Score: {assessment.ruleScore}/100
            </span>
          </div>

          <div className="space-y-3">
            {assessment.signals.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No deterministic rules violated.</p>
            ) : (
              assessment.signals.map((sig, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{sig.name}</span>
                    <span className="font-mono font-bold text-amber-400">+{sig.scoreContribution} pts</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{sig.evidence}</p>
                  {(sig.baselineValue !== undefined || sig.observedValue !== undefined) && (
                    <div className="flex items-center space-x-4 pt-1 text-[10px] text-slate-400 font-mono">
                      <span>Baseline: {sig.baselineValue}</span>
                      <span>Observed: {sig.observedValue}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Layer 2: Machine Learning Prediction Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Layer 2: Machine Learning Model</h3>
                <p className="text-xs text-slate-400">{assessment.modelVersion}</p>
              </div>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-semibold">
              Model Score: {assessment.modelScore} ({(assessment.modelProbability * 100).toFixed(1)}% prob)
            </span>
          </div>

          {/* SHAP-style Feature Contributions */}
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400 font-medium">Feature Contribution Breakdown (SHAP Weights):</p>
            {assessment.featureContributions.map((fc, idx) => {
              const increasesRisk = fc.impact === 'increases_risk';
              return (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200">{fc.label}</span>
                    <span
                      className={`font-mono font-bold text-[11px] ${
                        increasesRisk ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {increasesRisk ? `+${fc.weight} log-odds` : `${fc.weight} log-odds`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{fc.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Layer 3: Generative AI Investigation Assistant */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <span>Layer 3: AI Investigation Assistant</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Grounded Evidence Synthesis
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Transforms structured rule signals &amp; ML outputs into an actionable analyst briefing
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
            <span>{assessment.aiExplanation ? 'Re-generate Briefing' : 'Generate AI Briefing'}</span>
          </button>
        </div>

        {assessment.aiExplanation ? (
          <div className="space-y-4 text-xs">
            {/* Executive Summary */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Executive Investigation Summary
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Engine: {assessment.aiExplanation.modelUsed}
                </span>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-sans">
                {assessment.aiExplanation.summary}
              </p>
            </div>

            {/* Evidence & Hypotheses Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Grounded Evidence Citations */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Verified Evidence Citations
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-[11px]">
                  {assessment.aiExplanation.evidencePoints.map((pt, i) => (
                    <li key={i} className="leading-normal">{pt}</li>
                  ))}
                </ul>
              </div>

              {/* Syndicate / Risk Thesis */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Risk Hypothesis
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    Uncertainty: {assessment.aiExplanation.uncertaintyRating}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {assessment.aiExplanation.syndicateHypothesis}
                </p>
              </div>
            </div>

            {/* Recommended Next Steps */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Recommended Analyst Actions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {assessment.aiExplanation.recommendedActions.map((action, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-start space-x-2"
                  >
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 space-y-2">
            <Sparkles className="w-6 h-6 text-cyan-400 mx-auto" />
            <p>Click "Generate AI Briefing" to run Gemini analysis on the verified rule and ML signals.</p>
          </div>
        )}
      </div>

      {/* Case Management & Disposition Workspace */}
      {fraudCase && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Case Investigation Management</h3>
              <p className="text-xs text-slate-400">
                Case ID: <span className="font-mono text-purple-400">{fraudCase.id}</span> • Assigned to:{' '}
                <span className="text-slate-200">{fraudCase.assignedTo}</span>
              </p>
            </div>

            {/* Disposition Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleStatusChange('CONFIRMED_FRAUD')}
                disabled={isUpdatingStatus || fraudCase.status === 'CONFIRMED_FRAUD'}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-40"
              >
                Mark Confirmed Fraud
              </button>
              <button
                onClick={() => handleStatusChange('FALSE_POSITIVE')}
                disabled={isUpdatingStatus || fraudCase.status === 'FALSE_POSITIVE'}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-40"
              >
                Mark Legitimate (False Positive)
              </button>
              <button
                onClick={() => handleStatusChange('ESCALATED')}
                disabled={isUpdatingStatus || fraudCase.status === 'ESCALATED'}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition disabled:opacity-40"
              >
                Escalate to Senior Triage
              </button>
              <button
                onClick={() => handleStatusChange('RESOLVED')}
                disabled={isUpdatingStatus || fraudCase.status === 'RESOLVED'}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition disabled:opacity-40"
              >
                Resolve Case
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Notes Timeline */}
            <div className="md:col-span-2 space-y-3">
              <p className="text-xs font-semibold text-slate-300">Investigation Notes &amp; Audit Log:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {fraudCase.notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg text-xs border ${
                      note.isSystemGenerated
                        ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                        : 'bg-slate-950 border-blue-500/20 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-300">{note.author}</span>
                      <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add analyst note or call log..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNoteContent.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            </div>

            {/* Account & Device Profile Snapshot */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h4 className="font-semibold text-slate-200">Entity Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Account ID:</span>
                  <span className="font-mono text-slate-200">{transaction.accountId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Customer Name:</span>
                  <span className="text-slate-200">{transaction.accountName || 'Customer'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Device Hardware:</span>
                  <span className="font-mono text-amber-300">{transaction.deviceId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Device Type:</span>
                  <span className="text-slate-300">{transaction.deviceType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">IP Location:</span>
                  <span className="text-slate-300">
                    {transaction.ipAddress} ({transaction.country})
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Card Mask:</span>
                  <span className="font-mono text-slate-300">•••• {transaction.cardLast4}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigateToGraph(transaction.accountId)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5"
                >
                  <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View Entity in Graph</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
