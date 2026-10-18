import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Ban,
  ArrowUpDown,
  ExternalLink,
  Zap,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import type { Transaction, RiskAssessment, RiskLevel, TransactionStatus } from '../types/fraud.ts';

interface TransactionExplorerProps {
  transactions: { tx: Transaction; assessment: RiskAssessment }[];
  onSelectTransaction: (txId: string) => void;
  onOpenTestModal: () => void;
}

export const TransactionExplorer: React.FC<TransactionExplorerProps> = ({
  transactions,
  onSelectTransaction,
  onOpenTestModal,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'amount_desc' | 'score_desc'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Quick inspect drawer state
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter(({ tx, assessment }) => {
      if (statusFilter !== 'ALL' && assessment.status !== statusFilter) return false;
      if (riskFilter !== 'ALL' && assessment.riskLevel !== riskFilter) return false;
      if (categoryFilter !== 'ALL' && tx.merchantCategory !== categoryFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          tx.id.toLowerCase().includes(q) ||
          tx.accountId.toLowerCase().includes(q) ||
          (tx.accountName && tx.accountName.toLowerCase().includes(q)) ||
          tx.deviceId.toLowerCase().includes(q) ||
          tx.merchantName.toLowerCase().includes(q) ||
          tx.country.toLowerCase().includes(q) ||
          tx.cardLast4.includes(q);
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'amount_desc') return b.tx.amount - a.tx.amount;
      if (sortBy === 'score_desc') return b.assessment.combinedScore - a.assessment.combinedScore;
      // Default: newest
      return new Date(b.tx.timestamp).getTime() - new Date(a.tx.timestamp).getTime();
    });
  }, [transactions, search, statusFilter, riskFilter, categoryFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const selectedItem = selectedTxId
    ? transactions.find((item) => item.tx.id === selectedTxId)
    : null;

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Tx ID, Account, Device, Merchant, Card *4421..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Test Submission Button */}
          <button
            onClick={onOpenTestModal}
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Submit Test Transaction</span>
          </button>
        </div>

        {/* Filter Badges & Selects */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-1 text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Status: All</option>
            <option value="APPROVED">Status: APPROVED</option>
            <option value="FLAGGED">Status: FLAGGED</option>
            <option value="BLOCKED">Status: BLOCKED</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Risk: All Bands</option>
            <option value="CRITICAL">Risk: CRITICAL (80+)</option>
            <option value="HIGH">Risk: HIGH (60-79)</option>
            <option value="MEDIUM">Risk: MEDIUM (35-59)</option>
            <option value="LOW">Risk: LOW (&lt;35)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Category: All</option>
            <option value="electronics">Electronics</option>
            <option value="crypto_exchange">Crypto Exchange</option>
            <option value="wire_transfer">Wire Transfer</option>
            <option value="luxury_goods">Luxury Goods</option>
            <option value="gaming">Gaming</option>
            <option value="grocery">Grocery</option>
            <option value="travel">Travel</option>
          </select>

          {/* Sort By */}
          <div className="ml-auto flex items-center space-x-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="newest">Sort: Most Recent</option>
              <option value="score_desc">Sort: Highest Risk Score</option>
              <option value="amount_desc">Sort: Highest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tx ID</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Category / Merchant</th>
                <th className="py-3 px-4">Hardware Device</th>
                <th className="py-3 px-4 text-center">Rules</th>
                <th className="py-3 px-4 text-center">ML Prob</th>
                <th className="py-3 px-4 text-center">Combined</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                paginated.map(({ tx, assessment }) => {
                  const isFlagged = assessment.status === 'FLAGGED';
                  const isBlocked = assessment.status === 'BLOCKED';
                  const isCritical = assessment.riskLevel === 'CRITICAL';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/50 transition cursor-pointer"
                      onClick={() => setSelectedTxId(tx.id)}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-blue-400">
                        {tx.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{tx.accountId}</div>
                        <div className="text-[10px] text-slate-400">{tx.accountName || 'Customer'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {new Date(tx.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="capitalize text-slate-200">{tx.merchantCategory.replace('_', ' ')}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{tx.merchantName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <span className={tx.deviceId === 'DEV-204' ? 'text-amber-400 font-bold' : ''}>
                          {tx.deviceId}
                        </span>
                        {tx.deviceId === 'DEV-204' && (
                          <span className="ml-1 text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-sans">
                            Ring
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-amber-400 font-medium">
                        {assessment.ruleScore}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-purple-400 font-medium">
                        {(assessment.modelProbability * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isFlagged
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {assessment.combinedScore}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isBlocked ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <Ban className="w-3 h-3 mr-0.5" />
                            BLOCKED
                          </span>
                        ) : isFlagged ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <ShieldAlert className="w-3 h-3 mr-0.5" />
                            FLAGGED
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3 mr-0.5" />
                            APPROVED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(tx.id);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 text-[11px] font-medium transition inline-flex items-center space-x-1"
                          title="Open full investigation workspace"
                        >
                          <span>Investigate</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{filtered.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-200">{Math.min(page * pageSize, filtered.length)}</span> of{' '}
            <span className="font-semibold text-slate-200">{filtered.length}</span> transactions
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Slideover Drawer when row clicked */}
      {selectedItem && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Quick Inspect
                </span>
                <h3 className="text-base font-bold text-white font-mono">{selectedItem.tx.id}</h3>
              </div>
              <button
                onClick={() => setSelectedTxId(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Score Badge */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Combined Fraud Score</p>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {selectedItem.assessment.combinedScore}
                  </span>
                  <span className="text-xs text-slate-500">/ 100</span>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {selectedItem.assessment.riskLevel}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Status: {selectedItem.assessment.status}</p>
              </div>
            </div>

            {/* Key Tx Details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Account ID:</span>
                <span className="font-mono text-slate-200">{selectedItem.tx.accountId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Amount:</span>
                <span className="font-mono font-semibold text-white">
                  ${selectedItem.tx.amount.toFixed(2)} {selectedItem.tx.currency}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Merchant:</span>
                <span className="text-slate-200">{selectedItem.tx.merchantName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Device Hardware:</span>
                <span className="font-mono text-amber-300">{selectedItem.tx.deviceId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">IP Origin:</span>
                <span className="font-mono text-slate-300">
                  {selectedItem.tx.ipAddress} ({selectedItem.tx.country})
                </span>
              </div>
            </div>

            {/* Rule Signals List */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300">Triggered Risk Signals ({selectedItem.assessment.signals.length}):</p>
              {selectedItem.assessment.signals.length === 0 ? (
                <p className="text-xs text-slate-500">No anomalous rule signals triggered.</p>
              ) : (
                selectedItem.assessment.signals.map((sig, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between font-medium text-slate-200">
                      <span>{sig.name}</span>
                      <span className="text-amber-400 font-mono">+{sig.scoreContribution} pts</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">{sig.evidence}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => onSelectTransaction(selectedItem.tx.id)}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5"
            >
              <span>Open Full Investigation Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedTxId(null)}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
