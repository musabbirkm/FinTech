/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Add / Edit Income Modal with source categorization and currency isolation.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IncomeRecord, IncomeSource, PaymentMethod } from '../types';
import { toMinorUnits, toMajorUnits } from '../utils/money';
import { X, Plus, AlertCircle, Check, DollarSign } from 'lucide-react';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingIncome?: IncomeRecord | null;
}

const INCOME_SOURCES: IncomeSource[] = [
  'Salary',
  'Freelance',
  'Business',
  'Rental Income',
  'Investment / Dividends',
  'Gifts',
  'Refunds',
  'Other',
];

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  isOpen,
  onClose,
  editingIncome,
}) => {
  const { currency, addIncome, updateIncome } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(editingIncome ? editingIncome.date : todayStr);
  const [amountStr, setAmountStr] = useState(
    editingIncome ? toMajorUnits(editingIncome.amountMinor, editingIncome.currency).toString() : ''
  );
  const [source, setSource] = useState<string>(editingIncome ? editingIncome.source : 'Salary');
  const [customSource, setCustomSource] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editingIncome ? editingIncome.paymentMethod : 'BANK_TRANSFER'
  );
  const [description, setDescription] = useState(editingIncome ? editingIncome.description || '' : '');
  const [tagsStr, setTagsStr] = useState(editingIncome?.tags ? editingIncome.tags.join(', ') : '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amountStr);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive income amount.');
      return;
    }

    const finalSource = source === 'Other' && customSource.trim() ? customSource.trim() : source;

    const amountMinor = toMinorUnits(amountStr, currency);
    const tags = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingIncome) {
      updateIncome({
        ...editingIncome,
        date,
        amountMinor,
        source: finalSource,
        paymentMethod,
        description: description.trim() || undefined,
        tags: tags.length ? tags : undefined,
      });
    } else {
      addIncome({
        date,
        amountMinor,
        source: finalSource,
        paymentMethod,
        description: description.trim() || undefined,
        tags: tags.length ? tags : undefined,
      });
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="income-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-5 shadow-2xl my-auto text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h2 id="income-modal-title" className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              {editingIncome ? 'Edit Income Record' : 'Record New Income'}
            </h2>
            <p className="text-xs text-slate-400">
              Credited in <span className="font-bold text-emerald-400">{currency}</span> ({currency === 'AED' ? 'UAE Dirham' : 'Indian Rupee'})
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label htmlFor="inc-amount-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Amount ({currency}) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-emerald-400">
                {currency === 'AED' ? 'AED' : '₹'}
              </span>
              <input
                id="inc-amount-input"
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
          </div>

          {/* Date and Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="inc-date-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Deposit Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="inc-date-input"
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="inc-paymethod-select" className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Channel
              </label>
              <select
                id="inc-paymethod-select"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="BANK_TRANSFER">Direct Bank Deposit / Wire</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card Payment</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Income Source */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Income Stream / Source <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INCOME_SOURCES.map(src => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSource(src)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    source === src
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold shadow-sm'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
            {source === 'Other' && (
              <input
                type="text"
                placeholder="Specify custom source name..."
                value={customSource}
                onChange={e => setCustomSource(e.target.value)}
                className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="inc-desc-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Description / Memo <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              id="inc-desc-input"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. October monthly salary deposit from employer"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="inc-tags-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Tags <span className="text-slate-500 font-normal">(comma-separated)</span>
            </label>
            <input
              id="inc-tags-input"
              type="text"
              value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
              placeholder="salary, corporate, primary"
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
              {editingIncome ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingIncome ? 'Update Income' : 'Save Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
