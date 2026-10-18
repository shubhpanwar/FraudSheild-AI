import React, { useState } from 'react';
import { FileText, Search, ShieldCheck, User, Cpu, ChevronDown, ChevronRight } from 'lucide-react';
import type { AuditEvent } from '../types/fraud.ts';

interface AuditLogViewProps {
  auditEvents: AuditEvent[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditEvents }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = auditEvents.filter((ev) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ev.id.toLowerCase().includes(q) ||
      ev.actor.toLowerCase().includes(q) ||
      ev.action.toLowerCase().includes(q) ||
      ev.entityId.toLowerCase().includes(q) ||
      ev.entityType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-white">Compliance &amp; Immutable Audit Trail</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              SOC-2 / PCI-DSS Ready
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Records all automated decision pipeline events, rule evaluations, model inferences, and analyst case dispositions.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor, action, or entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Events Stream Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Target</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((ev) => {
                  const isExpanded = expandedId === ev.id;
                  const isSystem = ev.actor.startsWith('system') || ev.actor.startsWith('simulator');

                  return (
                    <React.Fragment key={ev.id}>
                      <tr
                        className="hover:bg-slate-800/40 transition cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-slate-300">
                          {ev.id}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                          {new Date(ev.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                              isSystem
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {isSystem ? <Cpu className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                            <span>{ev.actor}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {ev.action}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          <span className="text-[10px] text-slate-500 mr-1.5">{ev.entityType}:</span>
                          <span>{ev.entityId}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-slate-400 hover:text-white p-1">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded JSON details */}
                      {isExpanded && (
                        <tr className="bg-slate-950">
                          <td colSpan={6} className="p-4 border-b border-slate-800">
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                              <pre>{JSON.stringify(ev.details, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
