/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Add / Edit Expense Modal with inline '+ Add New Category' picker.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category, ExpenseRecord, PaymentMethod } from '../types';
import { toMinorUnits, toMajorUnits } from '../utils/money';
import { CategoryIcon } from './CategoryIcon';
import { CategoryModal } from './CategoryModal';
import { X, Plus, AlertCircle, Check, Tag } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: ExpenseRecord | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  editingExpense,
}) => {
  const { currency, categories, addExpense, updateExpense } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(editingExpense ? editingExpense.date : todayStr);
  const [amountStr, setAmountStr] = useState(
    editingExpense ? toMajorUnits(editingExpense.amountMinor, editingExpense.currency).toString() : ''
  );
  const [categoryId, setCategoryId] = useState(
    editingExpense ? editingExpense.categoryId : categories[0]?.id || ''
  );
  const [merchant, setMerchant] = useState(editingExpense ? editingExpense.merchant : '');
  const [reason, setReason] = useState(editingExpense ? editingExpense.reason : '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editingExpense ? editingExpense.paymentMethod : 'CARD'
  );
  const [notes, setNotes] = useState(editingExpense ? editingExpense.notes || '' : '');
  const [tagsStr, setTagsStr] = useState(editingExpense?.tags ? editingExpense.tags.join(', ') : '');

  const [showCategoryCreateModal, setShowCategoryCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amountStr);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive expense amount.');
      return;
    }

    if (!categoryId) {
      setError('Please select or create an expense category.');
      return;
    }

    if (!merchant.trim()) {
      setError('Please enter the merchant, store, or recipient name.');
      return;
    }

    if (!reason.trim()) {
      setError('Please describe the purpose or reason for this expense.');
      return;
    }

    const amountMinor = toMinorUnits(amountStr, currency);
    const tags = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingExpense) {
      updateExpense({
        ...editingExpense,
        date,
        amountMinor,
        categoryId,
        merchant: merchant.trim(),
        reason: reason.trim(),
        paymentMethod,
        notes: notes.trim() || undefined,
        tags: tags.length ? tags : undefined,
      });
    } else {
      addExpense({
        date,
        amountMinor,
        categoryId,
        merchant: merchant.trim(),
        reason: reason.trim(),
        paymentMethod,
        notes: notes.trim() || undefined,
        tags: tags.length ? tags : undefined,
      });
    }

    onClose();
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
      >
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-5 shadow-2xl my-auto text-slate-100 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h2 id="expense-modal-title" className="text-base font-bold text-white">
                {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
              </h2>
              <p className="text-xs text-slate-400">
                Operating ledger in <span className="font-bold text-emerald-400">{currency}</span> ({currency === 'AED' ? 'UAE Dirham' : 'Indian Rupee'})
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
            {/* Amount and Currency */}
            <div>
              <label htmlFor="exp-amount-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Amount ({currency}) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-emerald-400">
                  {currency === 'AED' ? 'AED' : '₹'}
                </span>
                <input
                  id="exp-amount-input"
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
                <label htmlFor="exp-date-input" className="block text-xs font-semibold text-slate-300 mb-1">
                  Expense Date <span className="text-rose-400">*</span>
                </label>
                <input
                  id="exp-date-input"
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="exp-paymethod-select" className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  id="exp-paymethod-select"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NetBanking</option>
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Category Selection with INLINE '+ Add New Category' BUTTON */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Expense Category <span className="text-rose-400">*</span>
                </label>
                {/* INLINE ADD NEW CATEGORY BUTTON */}
                <button
                  type="button"
                  onClick={() => setShowCategoryCreateModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
                  aria-label="Add new custom category"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Category</span>
                </button>
              </div>

              {/* Category picker list */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                {categories.map(cat => {
                  const isSelected = cat.id === categoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                      >
                        <CategoryIcon iconName={cat.icon} size={15} />
                      </div>
                      <span className="text-[11px] font-medium leading-tight line-clamp-1">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedCategory && (
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
                  Selected: <strong className="text-slate-200">{selectedCategory.name}</strong>
                  {selectedCategory.monthlyBudgetMinor ? ` (Monthly Budget: ${toMajorUnits(selectedCategory.monthlyBudgetMinor, currency)} ${currency})` : ''}
                </p>
              )}
            </div>

            {/* Merchant / Vendor */}
            <div>
              <label htmlFor="exp-merchant-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Merchant / Vendor / Store <span className="text-rose-400">*</span>
              </label>
              <input
                id="exp-merchant-input"
                type="text"
                required
                value={merchant}
                onChange={e => setMerchant(e.target.value)}
                placeholder="e.g. Carrefour, ENOC, Lulu, Amazon, Apple Store"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Spending Reason */}
            <div>
              <label htmlFor="exp-reason-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Reason / Purpose <span className="text-rose-400">*</span>
              </label>
              <input
                id="exp-reason-input"
                type="text"
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Weekly family groceries, Salik toll recharge"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Optional Notes and Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="exp-tags-input" className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags <span className="text-slate-500 font-normal">(comma-separated)</span>
                </label>
                <input
                  id="exp-tags-input"
                  type="text"
                  value={tagsStr}
                  onChange={e => setTagsStr(e.target.value)}
                  placeholder="groceries, monthly, weekend"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="exp-notes-input" className="block text-xs font-semibold text-slate-300 mb-1">
                  Additional Notes
                </label>
                <input
                  id="exp-notes-input"
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Invoice # or receipt details"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Bottom Form Actions */}
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
                {editingExpense ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {editingExpense ? 'Update Expense' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sub-modal: Inline Category Creator */}
      {showCategoryCreateModal && (
        <CategoryModal
          isOpen={showCategoryCreateModal}
          onClose={() => setShowCategoryCreateModal(false)}
          onCategoryCreated={(newCat: Category) => {
            setCategoryId(newCat.id);
            setShowCategoryCreateModal(false);
          }}
        />
      )}
    </>
  );
};
