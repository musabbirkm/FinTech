/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debt & Credit Management Screen:
 * Separate financial ledger for Money I Owe (Debit) and Money Owed to Me (Credit),
 * complete with individual principal repayment logs, balance recalculation,
 * search filtering, file attachments, and safe deletion.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DebtRecord, DebtType, RepaymentRecord } from '../types';
import { formatMoney, calculateOutstandingDebt } from '../utils/money';
import { AddDebtModal } from '../components/AddDebtModal';
import { RepaymentModal } from '../components/RepaymentModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AttachmentManager } from '../components/AttachmentManager';
import { Footer } from '../components/Footer';
import {
  HandCoins,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Phone,
  Clock,
  History,
  FileText,
  Paperclip,
  X,
} from 'lucide-react';

export const DebtCreditScreen: React.FC = () => {
  const {
    currency,
    debts,
    repayments,
    totalDebtOwedMinor,
    totalCreditReceivableMinor,
    searchQuery,
    attachments,
    deleteDebt,
    deleteRepayment,
  } = useApp();

  const [activeTab, setActiveTab] = useState<DebtType>('DEBIT');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtRecord | null>(null);
  const [selectedDebtForRepayment, setSelectedDebtForRepayment] = useState<DebtRecord | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PARTIALLY_PAID' | 'FULLY_PAID'>('ALL');

  // Deletion modals
  const [debtToDelete, setDebtToDelete] = useState<DebtRecord | null>(null);
  const [repaymentToDelete, setRepaymentToDelete] = useState<RepaymentRecord | null>(null);
  const [selectedDebtForAttachments, setSelectedDebtForAttachments] = useState<DebtRecord | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredDebts = useMemo(() => {
    let list = debts.filter(d => d.type === activeTab);

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter(d => {
        const calc = calculateOutstandingDebt(d, repayments);
        if (statusFilter === 'FULLY_PAID') return calc.isFullyPaid;
        if (statusFilter === 'PARTIALLY_PAID') return calc.repaidMinor > 0 && !calc.isFullyPaid;
        if (statusFilter === 'ACTIVE') return !calc.isFullyPaid;
        return true;
      });
    }

    // Search query
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (trimmedQuery) {
      list = list.filter(d => {
        const debtReps = repayments.filter(r => r.debtId === d.id);
        const repMatch = debtReps.some(
          r =>
            (r.paymentMethod && r.paymentMethod.toLowerCase().includes(trimmedQuery)) ||
            (r.paymentSourceOrDest && r.paymentSourceOrDest.toLowerCase().includes(trimmedQuery)) ||
            (r.notes && r.notes.toLowerCase().includes(trimmedQuery))
        );

        const majorAmount = (d.originalAmountMinor / 100).toString();
        const formattedAmt = formatMoney(d.originalAmountMinor, d.currency).toLowerCase();

        return (
          d.personName.toLowerCase().includes(trimmedQuery) ||
          d.reason.toLowerCase().includes(trimmedQuery) ||
          (d.contactInfo && d.contactInfo.toLowerCase().includes(trimmedQuery)) ||
          (d.notes && d.notes.toLowerCase().includes(trimmedQuery)) ||
          majorAmount.includes(trimmedQuery) ||
          formattedAmt.includes(trimmedQuery) ||
          repMatch
        );
      });
    }

    return list;
  }, [debts, activeTab, statusFilter, repayments, searchQuery]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Debts & Credits Ledger
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {currency} Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Isolated borrowing & lending ledger. Principal does not distort operating income or expenses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingDebt(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'DEBIT' ? '+ Record Money I Owe' : '+ Record Credit Lent'}</span>
        </button>
      </div>

      {/* KPI Cards: Money I Owe vs Money Owed to Me */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div
          onClick={() => setActiveTab('DEBIT')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'DEBIT'
              ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-950/20'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-rose-400" />
              <span>Money I Owe (Debits Payable)</span>
            </span>
            {activeTab === 'DEBIT' && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Active View
              </span>
            )}
          </div>
          <span className="text-2xl font-black text-rose-400 tracking-tight">
            {formatMoney(totalDebtOwedMinor, currency)}
          </span>
          <p className="text-xs text-slate-400 mt-1">
            Outstanding loans, credit card balances, or personal obligations
          </p>
        </div>

        <div
          onClick={() => setActiveTab('CREDIT')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'CREDIT'
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>Money Owed to Me (Credits Receivable)</span>
            </span>
            {activeTab === 'CREDIT' && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active View
              </span>
            )}
          </div>
          <span className="text-2xl font-black text-emerald-400 tracking-tight">
            {formatMoney(totalCreditReceivableMinor, currency)}
          </span>
          <p className="text-xs text-slate-400 mt-1">
            Personal loans lent, advances given, or pending friend repayments
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {(['ALL', 'ACTIVE', 'PARTIALLY_PAID', 'FULLY_PAID'] as const).map(status => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === status
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            {status === 'ALL'
              ? 'All Records'
              : status === 'ACTIVE'
              ? 'Active / Unpaid'
              : status === 'PARTIALLY_PAID'
              ? 'Partially Paid'
              : 'Fully Settled'}
          </button>
        ))}
      </div>

      {/* Debt List */}
      <div className="space-y-4">
        {filteredDebts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            <HandCoins className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-400" />
            <p className="text-sm font-semibold text-slate-300">
              No {activeTab === 'DEBIT' ? 'debts payable' : 'credit receivables'} found.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'Try clearing your search query.' : 'Click the button above to record a new loan entry.'}
            </p>
          </div>
        ) : (
          filteredDebts.map(debt => {
            const { repaidMinor, outstandingMinor, percentageRepaid, isFullyPaid } =
              calculateOutstandingDebt(debt, repayments);
            const debtRepayments = repayments.filter(r => r.debtId === debt.id);
            const debtAtts = attachments.filter(a => a.recordId === debt.id);
            const isOverdue = debt.dueDate && debt.dueDate < todayStr && !isFullyPaid;
            const isExpanded = expandedDebtId === debt.id;

            return (
              <div
                key={debt.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md hover:border-slate-700 transition-colors"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Person and Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">{debt.personName}</span>
                        {isFullyPaid ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Settled
                          </span>
                        ) : isOverdue ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-800 text-slate-300">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-1 font-medium">{debt.reason}</p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Recorded: {debt.startDate}</span>
                        </span>
                        {debt.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                              Due: {debt.dueDate}
                            </span>
                          </span>
                        )}
                        {debt.contactInfo && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{debt.contactInfo}</span>
                          </span>
                        )}
                      </div>

                      {/* Attachments Trigger Button */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDebtForAttachments(debt)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700/60 transition-colors"
                          title="Manage Loan Documents & Receipts"
                          aria-label={`Manage documents for ${debt.personName}`}
                        >
                          <Paperclip className="w-3 h-3 text-emerald-400" />
                          <span>{debtAtts.length > 0 ? `${debtAtts.length} document(s)` : 'Attach document'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Financial Numbers & Actions */}
                    <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block text-left sm:text-right">
                          Remaining Balance
                        </span>
                        <span
                          className={`text-lg sm:text-xl font-extrabold ${
                            isFullyPaid
                              ? 'text-slate-500 line-through'
                              : activeTab === 'DEBIT'
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {formatMoney(outstandingMinor, debt.currency)}
                        </span>
                        <span className="text-[10px] text-slate-400 block text-left sm:text-right">
                          Original: {formatMoney(debt.originalAmountMinor, debt.currency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {!isFullyPaid && (
                          <button
                            type="button"
                            onClick={() => setSelectedDebtForRepayment(debt)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-sm cursor-pointer"
                          >
                            {activeTab === 'DEBIT' ? 'Record Repayment' : 'Record Collection'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDebt(debt);
                            setShowAddModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Edit Debt"
                          aria-label="Edit debt"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDebtToDelete(debt)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete Debt"
                          aria-label="Delete debt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Principal Repaid: {formatMoney(repaidMinor, debt.currency)} ({percentageRepaid}%)</span>
                      <span>Outstanding: {formatMoney(outstandingMinor, debt.currency)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                        style={{ width: `${percentageRepaid}%` }}
                      />
                    </div>
                  </div>

                  {/* Repayment History Accordion Trigger */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {debtRepayments.length} Repayment Event(s) {isExpanded ? '▲ Hide' : '▼ Show'}
                      </span>
                    </button>
                    {debt.notes && (
                      <span className="text-[11px] text-slate-500 italic truncate max-w-xs">
                        "{debt.notes}"
                      </span>
                    )}
                  </div>
                </div>

                {/* Repayment History Sub-list */}
                {isExpanded && (
                  <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Individual Repayment Log:
                    </h4>
                    {debtRepayments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No repayments recorded yet.</p>
                    ) : (
                      debtRepayments.map(rep => (
                        <div
                          key={rep.id}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-emerald-400">
                              +{formatMoney(rep.amountMinor, rep.currency)}
                            </span>
                            <span className="text-slate-400 text-[11px] ml-2">
                              {rep.date} &bull; {rep.paymentMethod}
                              {rep.paymentSourceOrDest ? ` (${rep.paymentSourceOrDest})` : ''}
                            </span>
                            {rep.notes && (
                              <p className="text-[11px] text-slate-500 mt-0.5 italic">"{rep.notes}"</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setRepaymentToDelete(rep)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded"
                            title="Delete repayment entry"
                            aria-label="Delete repayment entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Dialog for Deleting a Debt */}
      {debtToDelete && (
        <ConfirmDialog
          isOpen={!!debtToDelete}
          title={debtToDelete.type === 'DEBIT' ? 'Delete Debt Record' : 'Delete Credit Record'}
          message={`Are you sure you want to permanently delete the loan record with ${debtToDelete.personName} for ${formatMoney(debtToDelete.originalAmountMinor, debtToDelete.currency)}?`}
          subMessage="All recorded repayment entries and attached documents for this debt will also be permanently deleted. Balance totals will recalculate immediately."
          confirmText="Delete Debt Record"
          variant="danger"
          onConfirm={() => {
            deleteDebt(debtToDelete.id);
            setDebtToDelete(null);
          }}
          onClose={() => setDebtToDelete(null)}
        />
      )}

      {/* Confirmation Dialog for Deleting an Individual Repayment */}
      {repaymentToDelete && (
        <ConfirmDialog
          isOpen={!!repaymentToDelete}
          title="Delete Repayment Entry"
          message={`Remove repayment installment of ${formatMoney(repaymentToDelete.amountMinor, repaymentToDelete.currency)}?`}
          subMessage="The remaining outstanding debt balance will be restored automatically."
          confirmText="Delete Repayment"
          variant="danger"
          onConfirm={() => {
            deleteRepayment(repaymentToDelete.id);
            setRepaymentToDelete(null);
          }}
          onClose={() => setRepaymentToDelete(null)}
        />
      )}

      {/* Attachment Manager Modal for Debt */}
      {selectedDebtForAttachments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-emerald-400" />
                  Loan Documents & Agreements
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDebtForAttachments.personName} &bull; {selectedDebtForAttachments.reason}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDebtForAttachments(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <AttachmentManager
              recordId={selectedDebtForAttachments.id}
              recordType="DEBT"
              title="Loan Contracts & Receipts"
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddDebtModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingDebt(null);
          }}
          initialType={activeTab}
          editingDebt={editingDebt}
        />
      )}

      {selectedDebtForRepayment && (
        <RepaymentModal
          isOpen={!!selectedDebtForRepayment}
          onClose={() => setSelectedDebtForRepayment(null)}
          debt={selectedDebtForRepayment}
        />
      )}

      <Footer />
    </div>
  );
};
