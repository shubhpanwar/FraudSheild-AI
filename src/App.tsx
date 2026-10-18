import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, TabId } from './components/Navbar.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { TransactionExplorer } from './components/TransactionExplorer.tsx';
import { InvestigationWorkspace } from './components/InvestigationWorkspace.tsx';
import { RelationshipGraph } from './components/RelationshipGraph.tsx';
import { RulesAndModelLab } from './components/RulesAndModelLab.tsx';
import { AuditLogView } from './components/AuditLogView.tsx';
import { NewTransactionModal } from './components/NewTransactionModal.tsx';
import type {
  Transaction,
  RiskAssessment,
  FraudCase,
  DashboardSummary,
  NetworkGraphData,
  RulesConfig,
  ModelPerformanceMetrics,
  AuditEvent,
  CaseStatus,
  AIExplanation,
} from './types/fraud.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [transactionsWithAssessment, setTransactionsWithAssessment] = useState<
    { tx: Transaction; assessment: RiskAssessment }[]
  >([]);
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [graphData, setGraphData] = useState<NetworkGraphData | null>(null);
  const [rulesConfig, setRulesConfig] = useState<RulesConfig | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelPerformanceMetrics | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  const [selectedTxId, setSelectedTxId] = useState<string | null>('TXN-9001');
  const [selectedGraphEntityId, setSelectedGraphEntityId] = useState<string | undefined>(undefined);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'alert' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'alert' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all primary dataset states
  const refreshAll = useCallback(async () => {
    try {
      const [txRes, casesRes, sumRes, graphRes, rulesRes, metricsRes, auditRes] =
        await Promise.all([
          fetch('/api/v1/transactions?limit=100'),
          fetch('/api/v1/cases'),
          fetch('/api/v1/dashboard/summary'),
          fetch('/api/v1/graph'),
          fetch('/api/v1/rules'),
          fetch('/api/v1/model/metrics'),
          fetch('/api/v1/audit'),
        ]);

      if (txRes.ok) {
        const txJson = await txRes.json();
        setTransactionsWithAssessment(
          txJson.data.map((item: any) => ({
            tx: item,
            assessment: item.assessment,
          }))
        );
      }
      if (casesRes.ok) setCases(await casesRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
      if (graphRes.ok) setGraphData(await graphRes.json());
      if (rulesRes.ok) setRulesConfig(await rulesRes.json());
      if (metricsRes.ok) setModelMetrics(await metricsRes.json());
      if (auditRes.ok) setAuditEvents(await auditRes.json());
    } catch (err) {
      console.error('Failed to load FraudShield data:', err);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Simulator injection handler
  const handleSimulate = async (type: 'NORMAL' | 'SYNDICATE_RING') => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/v1/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshAll();
        if (type === 'SYNDICATE_RING') {
          showNotification(`Simulated syndicate burst injected: ${data.injectedCount} transactions on DEV-204!`, 'alert');
          setSelectedTxId(data.transactions[0]?.id || 'TXN-9001');
          setActiveTab('transactions');
        } else {
          showNotification('Simulated legitimate retail transaction processed & approved.');
        }
      }
    } finally {
      setIsSimulating(false);
    }
  };

  // Submit custom test transaction
  const handleSubmitTransaction = async (txData: Partial<Transaction>) => {
    const res = await fetch('/api/v1/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit transaction');
    }
    const data = await res.json();
    await refreshAll();
    showNotification(`Transaction ${data.transaction.id} processed: Status ${data.assessment.status} (${data.assessment.combinedScore}/100)`);
    return data;
  };

  // Update case status
  const handleUpdateCaseStatus = async (caseId: string, status: CaseStatus, resolution?: string) => {
    const res = await fetch(`/api/v1/cases/${caseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution, actor: 'analyst.sarah_k' }),
    });
    if (res.ok) {
      await refreshAll();
      showNotification(`Case ${caseId} updated to [${status}]`);
    }
  };

  // Add note to case
  const handleAddCaseNote = async (caseId: string, content: string) => {
    const res = await fetch(`/api/v1/cases/${caseId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, author: 'analyst.sarah_k' }),
    });
    if (res.ok) {
      await refreshAll();
      showNotification('Note added to case file.');
    }
  };

  // Generate AI Investigation Explanation
  const handleGenerateAIExplanation = async (transactionId: string): Promise<AIExplanation | null> => {
    const res = await fetch('/api/v1/ai/investigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId }),
    });
    if (res.ok) {
      const explanation = await res.json();
      await refreshAll();
      showNotification('AI Investigation briefing synthesized from verified evidence.');
      return explanation;
    }
    return null;
  };

  // Update scoring policy / weights config
  const handleUpdateRulesConfig = async (newConfig: RulesConfig) => {
    const res = await fetch('/api/v1/rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    if (res.ok) {
      await refreshAll();
      showNotification('Rules & ML ensemble configuration updated and applied.');
    }
  };

  // Select transaction to investigate
  const handleSelectTransaction = (txId: string) => {
    setSelectedTxId(txId);
    setActiveTab('investigation');
  };

  // Jump to graph with entity highlight
  const handleNavigateToGraph = (entityId?: string) => {
    setSelectedGraphEntityId(entityId);
    setActiveTab('graph');
  };

  // Derived active transaction & case for investigation workspace
  const currentItem = selectedTxId
    ? transactionsWithAssessment.find((item) => item.tx.id === selectedTxId) ||
      transactionsWithAssessment[0]
    : transactionsWithAssessment[0];

  const currentCase = currentItem
    ? cases.find((c) => c.transactionId === currentItem.tx.id) || null
    : null;

  const rawTransactionsList = transactionsWithAssessment.map((i) => i.tx);

  const openCasesCount = cases.filter(
    (c) => c.status === 'OPEN' || c.status === 'INVESTIGATING'
  ).length;

  const criticalAlertsCount = transactionsWithAssessment.filter(
    (i) => i.assessment.riskLevel === 'CRITICAL'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center space-x-2 border animate-bounce ${
            notification.type === 'alert'
              ? 'bg-rose-950 border-rose-500 text-rose-200'
              : 'bg-slate-900 border-blue-500 text-blue-200'
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCasesCount={openCasesCount}
        criticalAlertsCount={criticalAlertsCount}
        onSimulate={handleSimulate}
        isSimulating={isSimulating}
        onOpenNewTxModal={() => setIsNewTxModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            summary={summary}
            recentFlaggedTransactions={transactionsWithAssessment.filter(
              (i) => i.assessment.status === 'FLAGGED' || i.assessment.status === 'BLOCKED'
            )}
            onSelectTransaction={handleSelectTransaction}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionExplorer
            transactions={transactionsWithAssessment}
            onSelectTransaction={handleSelectTransaction}
            onOpenTestModal={() => setIsNewTxModalOpen(true)}
          />
        )}

        {activeTab === 'investigation' && (
          <InvestigationWorkspace
            transaction={currentItem?.tx || null}
            assessment={currentItem?.assessment || null}
            fraudCase={currentCase}
            allTransactions={rawTransactionsList}
            onUpdateCaseStatus={handleUpdateCaseStatus}
            onAddCaseNote={handleAddCaseNote}
            onGenerateAIExplanation={handleGenerateAIExplanation}
            onNavigateToGraph={handleNavigateToGraph}
            onSelectTransaction={handleSelectTransaction}
          />
        )}

        {activeTab === 'graph' && (
          <RelationshipGraph
            graphData={graphData}
            onSelectTransaction={handleSelectTransaction}
            selectedEntityId={selectedGraphEntityId}
          />
        )}

        {activeTab === 'rules_lab' && rulesConfig && (
          <RulesAndModelLab
            currentRulesConfig={rulesConfig}
            onUpdateRulesConfig={handleUpdateRulesConfig}
            modelMetrics={modelMetrics}
          />
        )}

        {activeTab === 'audit' && <AuditLogView auditEvents={auditEvents} />}
      </main>

      {/* New Test Transaction Ingest Modal */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
        onSubmitTransaction={handleSubmitTransaction}
        onInspectResult={handleSelectTransaction}
      />
    </div>
  );
}
