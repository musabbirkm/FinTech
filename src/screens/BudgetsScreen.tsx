/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Budgets & Savings Goals Screen.
 * Monthly category budget utilization with threshold warnings, and savings goal trackers.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SavingsGoal } from '../types';
import { formatMoney, toMinorUnits, toMajorUnits } from '../utils/money';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Footer } from '../components/Footer';
import {
  Target,
  Plus,
  AlertTriangle,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Sparkles,
} from 'lucide-react';

export const BudgetsScreen: React.FC = () => {
  const {
    currency,
    categories,
    periodExpenses,
    totalExpenseMinor,
    savingsGoals,
    searchQuery,
    addSavingsGoal,
    updateSavingsGoal,
    contributeToGoal,
    deleteSavingsGoal,
    updateCategory,
  } = useApp();

  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [showContributeModal, setShowContributeModal] = useState<SavingsGoal | null>(null);
  const [contributeAmountStr, setContributeAmountStr] = useState('');
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  // Form states for Savings Goal
  const todayStr = new Date().toISOString().split('T')[0];
  const [goalName, setGoalName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('0');
  const [targetDate, setTargetDate] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Edit category budget state
  const [editingCategoryBudget, setEditingCategoryBudget] = useState<{ id: string; budgetStr: string } | null>(null);

  // Savings goals submission
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!goalName.trim()) {
      setError('Goal name is required.');
      return;
    }

    const targetAmount = parseFloat(targetAmountStr);
    if (!targetAmount || targetAmount <= 0) {
      setError('Target amount must be a positive number.');
      return;
    }

    const targetAmountMinor = toMinorUnits(targetAmountStr, currency);
    const currentAmountMinor = toMinorUnits(currentAmountStr || '0', currency);

    if (editingGoal) {
      updateSavingsGoal({
        ...editingGoal,
        name: goalName.trim(),
        targetAmountMinor,
        currentAmountMinor,
        targetDate,
        notes: notes.trim() || undefined,
      });
    } else {
      addSavingsGoal({
        name: goalName.trim(),
        targetAmountMinor,
        currentAmountMinor,
        targetDate,
        notes: notes.trim() || undefined,
      });
    }

    setShowAddGoalModal(false);
    resetGoalForm();
  };

  const resetGoalForm = () => {
    setGoalName('');
    setTargetAmountStr('');
    setCurrentAmountStr('0');
    setTargetDate(todayStr);
    setNotes('');
    setEditingGoal(null);
    setError(null);
  };

  const handleOpenEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setTargetAmountStr(toMajorUnits(goal.targetAmountMinor, goal.currency).toString());
    setCurrentAmountStr(toMajorUnits(goal.currentAmountMinor, goal.currency).toString());
    setTargetDate(goal.targetDate);
    setNotes(goal.notes || '');
    setShowAddGoalModal(true);
  };

  // Category spending calculation
  const budgetList = categories.map(cat => {
    const catExpenses = periodExpenses.filter(e => e.categoryId === cat.id);
    const spentMinor = catExpenses.reduce((sum, e) => sum + e.amountMinor, 0);
    const budgetMinor = cat.monthlyBudgetMinor || 0;
    const remainingMinor = Math.max(0, budgetMinor - spentMinor);
    const overspentMinor = Math.max(0, spentMinor - budgetMinor);
    const percent = budgetMinor > 0 ? Math.round((spentMinor / budgetMinor) * 100) : null;

    return {
      category: cat,
      spentMinor,
      budgetMinor,
      remainingMinor,
      overspentMinor,
      percent,
      isOver: percent !== null && percent > 100,
      isNearLimit: percent !== null && percent >= 80 && percent <= 100,
    };
  });

  const totalMonthlyBudgetMinor = categories.reduce((sum, c) => sum + (c.monthlyBudgetMinor || 0), 0);
  const totalOverspentMinor = budgetList.reduce((sum, b) => sum + b.overspentMinor, 0);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredBudgetList = useMemo(() => {
    if (!trimmedQuery) return budgetList;
    return budgetList.filter(b => b.category.name.toLowerCase().includes(trimmedQuery));
  }, [budgetList, trimmedQuery]);

  const filteredGoals = useMemo(() => {
    if (!trimmedQuery) return savingsGoals;
    return savingsGoals.filter(
      g =>
        g.name.toLowerCase().includes(trimmedQuery) ||
        (g.notes && g.notes.toLowerCase().includes(trimmedQuery)) ||
        g.targetDate.includes(trimmedQuery) ||
        (g.targetAmountMinor / 100).toString().includes(trimmedQuery)
    );
  }, [savingsGoals, trimmedQuery]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Budgets & Savings Goals
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {currency} Targets
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure monthly caps per category and track long-term savings goals
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetGoalForm();
            setShowAddGoalModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Savings Goal</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Monthly Budget ({currency})
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-white block mt-1">
            {formatMoney(totalMonthlyBudgetMinor, currency)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {categories.filter(c => c.monthlyBudgetMinor).length} budgeted categories
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Current Spend ({currency})
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-rose-400 block mt-1">
            {formatMoney(totalExpenseMinor, currency)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalMonthlyBudgetMinor > 0
              ? `${Math.round((totalExpenseMinor / totalMonthlyBudgetMinor) * 100)}% of total monthly ceiling`
              : 'No overall cap'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Overspending Alerts
          </span>
          <span
            className={`text-xl sm:text-2xl font-extrabold block mt-1 ${
              totalOverspentMinor > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {totalOverspentMinor > 0 ? `-${formatMoney(totalOverspentMinor, currency)}` : 'On Track'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {budgetList.filter(b => b.isOver).length} category over budget
          </span>
        </div>
      </div>

      {/* SECTION 1: MONTHLY CATEGORY BUDGETS */}
      <div className="mb-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Category Monthly Budgets ({currency})
            </h2>
            <p className="text-[11px] text-slate-400">
              Spending vs allocation with automated threshold warnings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredBudgetList.map(item => {
            const isEditingThis = editingCategoryBudget?.id === item.category.id;

            return (
              <div
                key={item.category.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.isOver
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                    : item.isNearLimit
                    ? 'bg-amber-950/15 border-amber-500/30'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.category.color}25`, color: item.category.color }}
                    >
                      <CategoryIcon iconName={item.category.icon} size={15} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white">{item.category.name}</span>
                      {item.isOver && (
                        <span className="text-[10px] text-rose-400 font-bold ml-2">OVER BUDGET</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-white block">
                      {formatMoney(item.spentMinor, currency)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.budgetMinor > 0
                        ? `Limit: ${formatMoney(item.budgetMinor, currency)}`
                        : 'No budget configured'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {item.budgetMinor > 0 ? (
                  <>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, item.percent || 0)}%`,
                          backgroundColor: item.isOver ? '#f43f5e' : item.isNearLimit ? '#f59e0b' : item.category.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className={item.isOver ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {item.percent}% spent
                      </span>
                      <span className={item.isOver ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {item.isOver
                          ? `Overspent by ${formatMoney(item.overspentMinor, currency)}`
                          : `${formatMoney(item.remainingMinor, currency)} remaining`}
                      </span>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCategoryBudget({
                        id: item.category.id,
                        budgetStr: '',
                      })
                    }
                    className="text-[11px] text-emerald-400 hover:underline font-semibold"
                  >
                    + Set monthly budget
                  </button>
                )}

                {/* Inline Quick Budget Edit */}
                {isEditingThis && editingCategoryBudget && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder={`Budget in ${currency}`}
                      value={editingCategoryBudget.budgetStr}
                      onChange={e =>
                        setEditingCategoryBudget(prev =>
                          prev ? { ...prev, budgetStr: e.target.value } : null
                        )
                      }
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!editingCategoryBudget) return;
                        const newBudgetMinor = editingCategoryBudget.budgetStr
                          ? toMinorUnits(editingCategoryBudget.budgetStr, currency)
                          : undefined;
                        updateCategory({
                          ...item.category,
                          monthlyBudgetMinor: newBudgetMinor,
                        });
                        setEditingCategoryBudget(null);
                      }}
                      className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategoryBudget(null)}
                      className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: SAVINGS GOALS */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Savings & Milestone Goals ({savingsGoals.length})
            </h2>
            <p className="text-[11px] text-slate-400">Target funds in {currency}</p>
          </div>
        </div>

        {savingsGoals.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-400" />
            <p className="text-xs font-medium">No savings goals created for {currency}.</p>
            <button
              type="button"
              onClick={() => {
                resetGoalForm();
                setShowAddGoalModal(true);
              }}
              className="mt-3 px-3.5 py-1.5 bg-teal-500 text-slate-950 font-bold text-xs rounded-xl"
            >
              + Create First Savings Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map(goal => {
              const pct = goal.targetAmountMinor > 0
                ? Math.min(100, Math.round((goal.currentAmountMinor / goal.targetAmountMinor) * 100))
                : 100;
              const remainingMinor = Math.max(0, goal.targetAmountMinor - goal.currentAmountMinor);
              const isCompleted = goal.currentAmountMinor >= goal.targetAmountMinor;

              return (
                <div
                  key={goal.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{goal.name}</span>
                    {isCompleted ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Goal Achieved!
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">
                        Target: {goal.targetDate}
                      </span>
                    )}
                  </div>

                  {goal.notes && <p className="text-xs text-slate-400 mb-3">{goal.notes}</p>}

                  {/* Progress info */}
                  <div className="flex justify-between items-baseline mb-1 text-xs">
                    <div>
                      <span className="text-lg font-extrabold text-teal-400">
                        {formatMoney(goal.currentAmountMinor, goal.currency)}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1">
                        / {formatMoney(goal.targetAmountMinor, goal.currency)}
                      </span>
                    </div>
                    <span className="font-extrabold text-white text-xs">{pct}%</span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400">
                      {isCompleted
                        ? 'Target fully funded'
                        : `${formatMoney(remainingMinor, goal.currency)} remaining`}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowContributeModal(goal);
                          setContributeAmountStr('');
                        }}
                        className="px-2.5 py-1 text-xs font-bold bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 rounded-lg border border-teal-500/30"
                      >
                        + Add Funds
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditGoal(goal)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Edit Goal"
                        aria-label={`Edit ${goal.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalToDelete(goal)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                        title="Delete Goal"
                        aria-label={`Delete ${goal.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contribute Funds Modal */}
      {showContributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl text-slate-100">
            <h3 className="text-sm font-bold text-white mb-2">
              Add Funds to "{showContributeModal.name}"
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Enter deposit amount in {showContributeModal.currency}
            </p>
            <input
              type="number"
              step="any"
              min="0.01"
              value={contributeAmountStr}
              onChange={e => setContributeAmountStr(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-teal-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowContributeModal(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const num = parseFloat(contributeAmountStr);
                  if (num > 0) {
                    const minor = toMinorUnits(contributeAmountStr, showContributeModal.currency);
                    contributeToGoal(showContributeModal.id, minor);
                    setShowContributeModal(null);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold bg-teal-500 text-slate-950 rounded-xl shadow-md"
              >
                Confirm Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl my-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-400" />
                {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddGoalModal(false);
                  resetGoalForm();
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

            <form onSubmit={handleSaveGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Goal Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                  placeholder="e.g. Emergency Fund, New Car Downpayment, Hajj / Umrah"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Amount ({currency}) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={targetAmountStr}
                    onChange={e => setTargetAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Current Saved ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={currentAmountStr}
                    onChange={e => setCurrentAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Notes or Bank Details
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. High Yield Deposit Account #..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddGoalModal(false);
                    resetGoalForm();
                  }}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 rounded-xl shadow-md"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Savings Goal */}
      {goalToDelete && (
        <ConfirmDialog
          isOpen={!!goalToDelete}
          title="Delete Savings Goal"
          message={`Are you sure you want to permanently delete the savings goal "${goalToDelete.name}"?`}
          subMessage="Target history and saved progress will be removed."
          confirmText="Delete Goal"
          variant="danger"
          onConfirm={() => {
            deleteSavingsGoal(goalToDelete.id);
            setGoalToDelete(null);
          }}
          onClose={() => setGoalToDelete(null)}
        />
      )}

      <Footer />
    </div>
  );
};
