/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Income Screen: Full income management, stream breakdown, receipts, and detailed transaction records.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { IncomeRecord } from '../types';
import { formatMoney } from '../utils/money';
import { AddIncomeModal } from '../components/AddIncomeModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AttachmentManager } from '../components/AttachmentManager';
import { Footer } from '../components/Footer';
import {
  TrendingUp,
  Plus,
  ArrowUpDown,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  ArrowDownLeft,
  Paperclip,
  X,
} from 'lucide-react';

export const IncomeScreen: React.FC = () => {
  const {
    currency,
    periodIncomes,
    totalIncomeMinor,
    searchQuery,
    attachments,
    deleteIncome,
  } = useApp();

  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);

  // Deletion & Attachment modals
  const [incomeToDelete, setIncomeToDelete] = useState<IncomeRecord | null>(null);
  const [selectedIncomeForAttachments, setSelectedIncomeForAttachments] = useState<IncomeRecord | null>(null);

  // Filtered income list
  const filteredIncomes = useMemo(() => {
    let list = periodIncomes;

    if (selectedSource !== 'ALL') {
      list = list.filter(i => i.source === selectedSource);
    }

    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (trimmedQuery) {
      list = list.filter(i => {
        const majorAmount = (i.amountMinor / 100).toString();
        const formattedAmt = formatMoney(i.amountMinor, currency).toLowerCase();

        return (
          i.source.toLowerCase().includes(trimmedQuery) ||
          i.paymentMethod.toLowerCase().includes(trimmedQuery) ||
          majorAmount.includes(trimmedQuery) ||
          formattedAmt.includes(trimmedQuery) ||
          (i.description && i.description.toLowerCase().includes(trimmedQuery)) ||
          (i.tags && i.tags.some(t => t.toLowerCase().includes(trimmedQuery)))
        );
      });
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      if (sortBy === 'amount_desc') return b.amountMinor - a.amountMinor;
      if (sortBy === 'amount_asc') return a.amountMinor - b.amountMinor;
      return 0;
    });
  }, [periodIncomes, selectedSource, searchQuery, sortBy, currency]);

  // Income sources summary
  const sourceStats = useMemo(() => {
    const map = new Map<string, { totalMinor: number; count: number }>();
    for (const inc of periodIncomes) {
      const cur = map.get(inc.source) || { totalMinor: 0, count: 0 };
      map.set(inc.source, {
        totalMinor: cur.totalMinor + inc.amountMinor,
        count: cur.count + 1,
      });
    }
    return Array.from(map.entries()).map(([source, data]) => ({
      source,
      totalMinor: data.totalMinor,
      count: data.count,
    })).sort((a, b) => b.totalMinor - a.totalMinor);
  }, [periodIncomes]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Income Management
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {currency} Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Record salaries, freelance payments, rental yields, and business dividends
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingIncome(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Income</span>
        </button>
      </div>

      {/* KPI Highlight Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Inflow Recorded
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              +{formatMoney(totalIncomeMinor, currency)}
            </span>
            <span className="text-xs text-slate-500">
              across {periodIncomes.length} deposit(s)
            </span>
          </div>
        </div>

        {/* Source breakdown pills */}
        <div className="flex flex-wrap items-center gap-2">
          {sourceStats.slice(0, 3).map(stat => (
            <div
              key={stat.source}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2"
            >
              <span className="font-semibold text-white">{stat.source}</span>
              <span className="font-bold text-emerald-400">
                {formatMoney(stat.totalMinor, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 sm:p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Source Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedSource('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedSource === 'ALL'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Sources ({periodIncomes.length})
          </button>
          {sourceStats.map(stat => (
            <button
              key={stat.source}
              type="button"
              onClick={() => setSelectedSource(stat.source)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedSource === stat.source
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {stat.source} ({stat.count})
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            aria-label="Sort income entries"
          >
            <option value="date_desc">Latest Date</option>
            <option value="date_asc">Oldest Date</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredIncomes.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
            <p className="text-sm font-semibold text-slate-300">No income records found.</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'Try clearing your search query.' : 'Click "+ Record Income" to register your first earnings.'}
            </p>
          </div>
        ) : (
          filteredIncomes.map(inc => {
            const incAtts = attachments.filter(a => a.recordId === inc.id);
            return (
              <div
                key={inc.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{inc.source}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-800 text-emerald-400 border border-emerald-500/20">
                        {inc.paymentMethod}
                      </span>
                    </div>
                    {inc.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{inc.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>{inc.date}</span>
                      {inc.tags && inc.tags.length > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="text-slate-400">#{inc.tags.join(' #')}</span>
                        </>
                      )}
                    </div>

                    {/* Receipt Attachment Badge */}
                    <div className="mt-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedIncomeForAttachments(inc)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700/60 transition-colors"
                        title="Manage Receipts & Attachments"
                        aria-label={`Manage receipts for ${inc.source}`}
                      >
                        <Paperclip className="w-3 h-3 text-emerald-400" />
                        <span>{incAtts.length > 0 ? `${incAtts.length} file(s)` : 'Attach receipt'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className="text-base font-extrabold text-emerald-400">
                    +{formatMoney(inc.amountMinor, currency)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIncome(inc);
                        setShowAddModal(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Income"
                      aria-label="Edit income"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncomeToDelete(inc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Income"
                      aria-label="Delete income"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Dialog for Deleting Income */}
      {incomeToDelete && (
        <ConfirmDialog
          isOpen={!!incomeToDelete}
          title="Delete Income Record"
          message={`Are you sure you want to permanently delete this income deposit of ${formatMoney(incomeToDelete.amountMinor, currency)} from ${incomeToDelete.source}?`}
          subMessage="Associated receipts and documents will also be removed. Account totals will recalculate immediately."
          confirmText="Delete Income"
          variant="danger"
          onConfirm={() => {
            deleteIncome(incomeToDelete.id);
            setIncomeToDelete(null);
          }}
          onClose={() => setIncomeToDelete(null)}
        />
      )}

      {/* Attachment Manager Modal for Income */}
      {selectedIncomeForAttachments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-emerald-400" />
                  Receipts & Salary Slips
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedIncomeForAttachments.source} &bull; {formatMoney(selectedIncomeForAttachments.amountMinor, currency)} &bull; {selectedIncomeForAttachments.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncomeForAttachments(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <AttachmentManager
              recordId={selectedIncomeForAttachments.id}
              recordType="INCOME"
            />
          </div>
        </div>
      )}

      {/* Add / Edit Income Modal */}
      {showAddModal && (
        <AddIncomeModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingIncome(null);
          }}
          editingIncome={editingIncome}
        />
      )}

      <Footer />
    </div>
  );
};
