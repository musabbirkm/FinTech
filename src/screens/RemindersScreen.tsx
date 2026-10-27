/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Reminders Screen: Scheduled repayment alerts and calendar notifications for debts and receivables.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReminderRecord, ReminderRepeat } from '../types';
import { formatMoney, toMinorUnits, toMajorUnits } from '../utils/money';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Footer } from '../components/Footer';
import {
  Bell,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  X,
  Check,
} from 'lucide-react';

export const RemindersScreen: React.FC = () => {
  const {
    currency,
    reminders,
    debts,
    searchQuery,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderComplete,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderRecord | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<ReminderRecord | null>(null);

  // Form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [relatedDebtId, setRelatedDebtId] = useState('');
  const [personOrOrg, setPersonOrOrg] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState(todayStr);
  const [reminderDateTime, setReminderDateTime] = useState(`${todayStr}T09:00`);
  const [repeatSchedule, setRepeatSchedule] = useState<ReminderRepeat>('NONE');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Reminder title is required.');
      return;
    }
    if (!personOrOrg.trim()) {
      setError('Person or Organization is required.');
      return;
    }

    const amountMinor = amountStr ? toMinorUnits(amountStr, currency) : undefined;

    if (editingReminder) {
      updateReminder({
        ...editingReminder,
        title: title.trim(),
        relatedDebtId: relatedDebtId || undefined,
        personOrOrg: personOrOrg.trim(),
        amountMinor,
        dueDate,
        reminderDateTime,
        repeatSchedule,
        notes: notes.trim() || undefined,
      });
    } else {
      addReminder({
        title: title.trim(),
        relatedDebtId: relatedDebtId || undefined,
        personOrOrg: personOrOrg.trim(),
        amountMinor,
        dueDate,
        reminderDateTime,
        repeatSchedule,
        notes: notes.trim() || undefined,
      });
    }

    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setRelatedDebtId('');
    setPersonOrOrg('');
    setAmountStr('');
    setDueDate(todayStr);
    setReminderDateTime(`${todayStr}T09:00`);
    setRepeatSchedule('NONE');
    setNotes('');
    setEditingReminder(null);
    setError(null);
  };

  const handleOpenEdit = (rem: ReminderRecord) => {
    setEditingReminder(rem);
    setTitle(rem.title);
    setRelatedDebtId(rem.relatedDebtId || '');
    setPersonOrOrg(rem.personOrOrg);
    setAmountStr(rem.amountMinor ? toMajorUnits(rem.amountMinor, rem.currency).toString() : '');
    setDueDate(rem.dueDate);
    setReminderDateTime(rem.reminderDateTime);
    setRepeatSchedule(rem.repeatSchedule);
    setNotes(rem.notes || '');
    setShowAddModal(true);
  };

  // Group reminders by status with search query filtering
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (rem: ReminderRecord) => {
    if (!trimmedQuery) return true;
    const majorAmount = rem.amountMinor ? (rem.amountMinor / 100).toString() : '';
    const formattedAmt = rem.amountMinor ? formatMoney(rem.amountMinor, rem.currency).toLowerCase() : '';
    return (
      rem.title.toLowerCase().includes(trimmedQuery) ||
      rem.personOrOrg.toLowerCase().includes(trimmedQuery) ||
      rem.dueDate.includes(trimmedQuery) ||
      majorAmount.includes(trimmedQuery) ||
      formattedAmt.includes(trimmedQuery) ||
      (rem.notes && rem.notes.toLowerCase().includes(trimmedQuery))
    );
  };

  const overdueList = reminders.filter(r => r.status !== 'COMPLETED' && r.dueDate < todayStr).filter(matchesSearch);
  const upcomingList = reminders.filter(r => r.status !== 'COMPLETED' && r.dueDate >= todayStr).filter(matchesSearch);
  const completedList = reminders.filter(r => r.status === 'COMPLETED').filter(matchesSearch);

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Scheduled Reminders
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {currency} Notifications
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Never miss loan installments, receivable collections, or bill due dates
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Reminder</span>
        </button>
      </div>

      {/* OVERDUE ALERTS SECTION */}
      {overdueList.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
            Overdue ({overdueList.length})
          </h2>
          <div className="space-y-2.5">
            {overdueList.map(rem => (
              <div
                key={rem.id}
                className="p-4 bg-rose-950/20 border border-rose-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{rem.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white">
                      OVERDUE
                    </span>
                  </div>
                  <p className="text-xs text-rose-200 mt-0.5">
                    {rem.personOrOrg} &bull; Due: {rem.dueDate}
                  </p>
                  {rem.notes && <p className="text-[11px] text-slate-400 italic mt-1">"{rem.notes}"</p>}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-rose-500/20">
                  {rem.amountMinor && (
                    <span className="text-sm font-extrabold text-rose-300">
                      {formatMoney(rem.amountMinor, rem.currency)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleReminderComplete(rem.id)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Paid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderToDelete(rem)}
                    className="p-1.5 text-slate-400 hover:text-rose-400"
                    title="Delete reminder"
                    aria-label={`Delete reminder ${rem.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPCOMING REMINDERS SECTION */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-400" />
          Upcoming Reminders ({upcomingList.length})
        </h2>
        {upcomingList.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-400" />
            <p className="text-xs font-medium">No upcoming reminders in {currency}.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingList.map(rem => (
              <div
                key={rem.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{rem.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-emerald-500/20">
                      {rem.dueDate === todayStr ? 'DUE TODAY' : `DUE IN ${rem.dueDate}`}
                    </span>
                    {rem.repeatSchedule !== 'NONE' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        Repeat: {rem.repeatSchedule}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {rem.personOrOrg} &bull; Alert set for {rem.reminderDateTime.replace('T', ' ')}
                  </p>
                  {rem.notes && <p className="text-[11px] text-slate-500 italic mt-1">"{rem.notes}"</p>}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  {rem.amountMinor && (
                    <span className="text-sm font-extrabold text-white">
                      {formatMoney(rem.amountMinor, rem.currency)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleReminderComplete(rem.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-1 border border-slate-700 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Done</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(rem)}
                    className="p-1.5 text-slate-400 hover:text-white"
                    title="Edit reminder"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderToDelete(rem)}
                    className="p-1.5 text-slate-400 hover:text-rose-400"
                    title="Delete reminder"
                    aria-label={`Delete reminder ${rem.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMPLETED REMINDERS */}
      {completedList.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
            Completed History ({completedList.length})
          </h2>
          <div className="space-y-2 opacity-75">
            {completedList.slice(0, 5).map(rem => (
              <div
                key={rem.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="line-through text-slate-400 font-medium">{rem.title}</span>
                  <span className="text-[11px] text-slate-500">({rem.personOrOrg})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleReminderComplete(rem.id)}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reactivate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderToDelete(rem)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Delete reminder"
                    aria-label={`Delete reminder ${rem.title}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl my-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                {editingReminder ? 'Edit Reminder' : 'Schedule New Repayment Reminder'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Reminder Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Car Loan Installment, Friend repayment collection"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Person or Organization <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={personOrOrg}
                  onChange={e => setPersonOrOrg(e.target.value)}
                  placeholder="e.g. Emirates NBD, Tariq, Landlord"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Link to existing Debt/Credit */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Link to Existing Debt/Credit Ledger <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <select
                  value={relatedDebtId}
                  onChange={e => {
                    setRelatedDebtId(e.target.value);
                    const selected = debts.find(d => d.id === e.target.value);
                    if (selected) {
                      setPersonOrOrg(selected.personName);
                      setTitle(`${selected.personName} - ${selected.reason}`);
                      if (selected.dueDate) setDueDate(selected.dueDate);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- No link (Standalone Reminder) --</option>
                  {debts.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.type === 'DEBIT' ? '[I Owe]' : '[Owed Me]'} {d.personName} - {d.reason}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={amountStr}
                    onChange={e => setAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Due Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Notification Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={reminderDateTime}
                    onChange={e => setReminderDateTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Repeat Schedule
                  </label>
                  <select
                    value={repeatSchedule}
                    onChange={e => setRepeatSchedule(e.target.value as ReminderRepeat)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="NONE">Once (No repeat)</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Additional Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Account number, payment reference..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-xl shadow-md"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Reminder */}
      {reminderToDelete && (
        <ConfirmDialog
          isOpen={!!reminderToDelete}
          title="Delete Reminder"
          message={`Are you sure you want to delete the reminder "${reminderToDelete.title}" for ${reminderToDelete.personOrOrg}?`}
          confirmText="Delete Reminder"
          variant="danger"
          onConfirm={() => {
            deleteReminder(reminderToDelete.id);
            setReminderToDelete(null);
          }}
          onClose={() => setReminderToDelete(null)}
        />
      )}

      <Footer />
    </div>
  );
};
