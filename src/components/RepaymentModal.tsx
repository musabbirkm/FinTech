/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Record Principal Repayment / Collection Event Modal.
 * Validates against outstanding balance in real time.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DebtRecord, PaymentMethod } from '../types';
import { toMinorUnits, toMajorUnits, formatMoney, calculateOutstandingDebt } from '../utils/money';
import { X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtRecord;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({
  isOpen,
  onClose,
  debt,
}) => {
  const { repayments, addRepayment } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const { outstandingMinor } = calculateOutstandingDebt(debt, repayments);
  const maxRepaymentMajor = toMajorUnits(outstandingMinor, debt.currency);

  const [date, setDate] = useState(todayStr);
  const [amountStr, setAmountStr] = useState(maxRepaymentMajor.toString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [paymentSourceOrDest, setPaymentSourceOrDest] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amountStr);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    const enteredMinor = toMinorUnits(amountStr, debt.currency);
    if (enteredMinor > outstandingMinor) {
      setError(
        `Payment amount (${formatMoney(enteredMinor, debt.currency)}) cannot exceed remaining balance (${formatMoney(
          outstandingMinor,
          debt.currency
        )}).`
      );
      return;
    }

    const res = addRepayment({
      debtId: debt.id,
      date,
      amountMinor: enteredMinor,
      paymentMethod,
      paymentSourceOrDest: paymentSourceOrDest.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (!res.success) {
      setError(res.error || 'Failed to record repayment.');
      return;
    }

    onClose();
  };

  const isDebit = debt.type === 'DEBIT';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repayment-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-5 shadow-2xl my-auto text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h2 id="repayment-modal-title" className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isDebit ? 'Record Principal Repayment' : 'Record Collected Payment'}
            </h2>
            <p className="text-xs text-slate-400">
              {debt.personName} &bull; {debt.reason}
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

        {/* Outstanding Summary Pill */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400">Current Remaining Balance:</span>
            <div className="text-sm font-extrabold text-emerald-400">
              {formatMoney(outstandingMinor, debt.currency)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAmountStr(maxRepaymentMajor.toString())}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
          >
            Pay Full Balance
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
            <label htmlFor="repay-amount-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Payment Amount ({debt.currency}) <span className="text-rose-400">*</span>
            </label>
            <input
              id="repay-amount-input"
              type="number"
              step="any"
              min="0.01"
              max={maxRepaymentMajor}
              required
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          {/* Date and Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="repay-date-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="repay-date-input"
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="repay-method-select" className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                id="repay-method-select"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Payment Account / Destination */}
          <div>
            <label htmlFor="repay-account-input" className="block text-xs font-semibold text-slate-300 mb-1">
              {isDebit ? 'Paid From Account' : 'Deposited To Account'}
            </label>
            <input
              id="repay-account-input"
              type="text"
              value={paymentSourceOrDest}
              onChange={e => setPaymentSourceOrDest(e.target.value)}
              placeholder="e.g. DIB Salary Account, HDFC Bank, Cash Drawer"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="repay-notes-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Transaction Reference / Notes
            </label>
            <input
              id="repay-notes-input"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. October installment reference #TRX8910"
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
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 rounded-xl shadow-md"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
