/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Add / Edit Debt & Credit Modal (Money I Owe vs Money Owed to Me).
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DebtRecord, DebtType } from '../types';
import { toMinorUnits, toMajorUnits } from '../utils/money';
import { X, Plus, AlertCircle, Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: DebtType;
  editingDebt?: DebtRecord | null;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({
  isOpen,
  onClose,
  initialType = 'DEBIT',
  editingDebt,
}) => {
  const { currency, addDebt, updateDebt } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [type, setType] = useState<DebtType>(editingDebt ? editingDebt.type : initialType);
  const [personName, setPersonName] = useState(editingDebt ? editingDebt.personName : '');
  const [contactInfo, setContactInfo] = useState(editingDebt ? editingDebt.contactInfo || '' : '');
  const [amountStr, setAmountStr] = useState(
    editingDebt ? toMajorUnits(editingDebt.originalAmountMinor, editingDebt.currency).toString() : ''
  );
  const [startDate, setStartDate] = useState(editingDebt ? editingDebt.startDate : todayStr);
  const [dueDate, setDueDate] = useState(editingDebt ? editingDebt.dueDate || '' : '');
  const [reason, setReason] = useState(editingDebt ? editingDebt.reason : '');
  const [notes, setNotes] = useState(editingDebt ? editingDebt.notes || '' : '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amountStr);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive principal amount.');
      return;
    }

    if (!personName.trim()) {
      setError('Please provide the counterparty person or institution name.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide the purpose or reason for this ledger entry.');
      return;
    }

    const originalAmountMinor = toMinorUnits(amountStr, currency);

    if (editingDebt) {
      updateDebt({
        ...editingDebt,
        type,
        personName: personName.trim(),
        contactInfo: contactInfo.trim() || undefined,
        originalAmountMinor,
        startDate,
        dueDate: dueDate || undefined,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
    } else {
      addDebt({
        type,
        personName: personName.trim(),
        contactInfo: contactInfo.trim() || undefined,
        originalAmountMinor,
        startDate,
        dueDate: dueDate || undefined,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="debt-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-5 shadow-2xl my-auto text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h2 id="debt-modal-title" className="text-base font-bold text-white">
              {editingDebt
                ? 'Edit Loan / Receivable Record'
                : type === 'DEBIT'
                ? 'Record Money I Owe (Debit)'
                : 'Record Money Owed to Me (Credit)'}
            </h2>
            <p className="text-xs text-slate-400">
              Isolated liability ledger in <span className="font-bold text-emerald-400">{currency}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Type Toggle: Debit vs Credit */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setType('DEBIT')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              type === 'DEBIT'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-rose-400" />
            <span>Debit (Money I Owe)</span>
          </button>
          <button
            type="button"
            onClick={() => setType('CREDIT')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              type === 'CREDIT'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span>Credit (Owed to Me)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Principal Amount */}
          <div>
            <label htmlFor="debt-amount-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Principal Amount ({currency}) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-emerald-400">
                {currency === 'AED' ? 'AED' : '₹'}
              </span>
              <input
                id="debt-amount-input"
                type="number"
                step="any"
                min="0.01"
                required
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-14 pr-4 py-2.5 text-base font-bold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Note: Principal borrowed or lent does NOT count as ordinary operating income or expense.
            </p>
          </div>

          {/* Person / Institution Name & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="debt-person-input" className="block text-xs font-semibold text-slate-300 mb-1">
                {type === 'DEBIT' ? 'Lender (Person / Bank)' : 'Borrower (Person / Org)'} <span className="text-rose-400">*</span>
              </label>
              <input
                id="debt-person-input"
                type="text"
                required
                value={personName}
                onChange={e => setPersonName(e.target.value)}
                placeholder="e.g. Emirates NBD, Tariq, Rahul"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="debt-contact-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Phone / Email
              </label>
              <input
                id="debt-contact-input"
                type="text"
                value={contactInfo}
                onChange={e => setContactInfo(e.target.value)}
                placeholder="+971-50-... or email"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Dates: Record Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="debt-start-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Date Borrowed / Lent <span className="text-rose-400">*</span>
              </label>
              <input
                id="debt-start-input"
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="debt-due-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Repayment Due Date <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                id="debt-due-input"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="debt-reason-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Reason / Purpose <span className="text-rose-400">*</span>
            </label>
            <input
              id="debt-reason-input"
              type="text"
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Car loan down-payment, friend emergency loan"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="debt-notes-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Additional Terms or Notes
            </label>
            <input
              id="debt-notes-input"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Installment terms, reference numbers..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 rounded-xl shadow-md flex items-center gap-1.5"
            >
              {editingDebt ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingDebt ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
