/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dashboard Screen: Overview of income, expenses, debts, category budgets, and quick actions.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatMoney, toMajorUnits, calculateOutstandingDebt } from '../utils/money';
import { CategoryIcon } from '../components/CategoryIcon';
import { Footer } from '../components/Footer';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { AddIncomeModal } from '../components/AddIncomeModal';
import { AddDebtModal } from '../components/AddDebtModal';
import { CategoryModal } from '../components/CategoryModal';
import { ScreenId } from '../components/Navigation';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  HandCoins,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';

export const DashboardScreen: React.FC<{
  onNavigate: (screen: ScreenId) => void;
}> = ({ onNavigate }) => {
  const {
    currency,
    period,
    periodIncomes,
    periodExpenses,
    totalIncomeMinor,
    totalExpenseMinor,
    netBalanceMinor,
    totalDebtOwedMinor,
    totalCreditReceivableMinor,
    categories,
    debts,
    repayments,
    reminders,
  } = useApp();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [debtTypeToAdd, setDebtTypeToAdd] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Today formatted
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Calculate top spending categories for active period
  const categorySpending = categories
    .map(cat => {
      const catExpenses = periodExpenses.filter(e => e.categoryId === cat.id);
      const spentMinor = catExpenses.reduce((sum, e) => sum + e.amountMinor, 0);
      return {
        category: cat,
        spentMinor,
        count: catExpenses.length,
        budgetMinor: cat.monthlyBudgetMinor || 0,
      };
    })
    .filter(item => item.spentMinor > 0)
    .sort((a, b) => b.spentMinor - a.spentMinor);

  // Recent transactions (last 6 combining incomes, expenses)
  const combinedRecent = [
    ...periodIncomes.map(i => ({ ...i, type: 'INCOME' as const })),
    ...periodExpenses.map(e => ({ ...e, type: 'EXPENSE' as const })),
  ].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

  // Overdue and upcoming reminders
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingReminders = reminders
    .filter(r => r.status !== 'COMPLETED')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen px-4 py-6 max-w-7xl mx-auto">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Financial Overview
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {currency === 'AED' ? 'AED (د.إ) Ledger' : 'INR (₹) Ledger'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{todayFormatted}</span>
          </p>
        </div>

        {/* Quick Add Actions */}
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowAddIncome(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+ Income</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all shadow-sm"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>+ Expense</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Category</span>
          </button>
        </div>
      </div>

      {/* Reminder Alert Banner if overdue or due soon */}
      {pendingReminders.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-rose-500/10 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">
                Action Required: {pendingReminders.length} Scheduled Repayment Reminder(s)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reminders')}
              className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {pendingReminders.map(rem => {
              const isOverdue = rem.dueDate < todayStr;
              return (
                <div
                  key={rem.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    isOverdue
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold truncate">{rem.title}</p>
                    <p className="text-[10px] text-slate-400">Due: {rem.dueDate}</p>
                  </div>
                  {rem.amountMinor && (
                    <span className="font-bold shrink-0 text-white">
                      {formatMoney(rem.amountMinor, rem.currency)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Core KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Income */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {formatMoney(totalIncomeMinor, currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {periodIncomes.length} deposit transaction(s)
          </p>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {formatMoney(totalExpenseMinor, currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {periodExpenses.length} expense transaction(s)
          </p>
        </div>

        {/* Net Operating Balance */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Net Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
              netBalanceMinor >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(netBalanceMinor, currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Income minus Expenses
          </p>
        </div>

        {/* Debts / Receivables Balance Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Debt & Credit Ledger
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-300 font-medium">I Owe:</span>
              <span className="font-bold text-rose-400">{formatMoney(totalDebtOwedMinor, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-medium">Owed to Me:</span>
              <span className="font-bold text-emerald-400">{formatMoney(totalCreditReceivableMinor, currency)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('debts')}
            className="text-[11px] text-indigo-300 hover:text-indigo-200 mt-2 font-semibold flex items-center gap-1"
          >
            <span>Manage Debts</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Grid: Category Spending vs Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Breakdown & Budget Utilization */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Expense Breakdown by Category</h2>
              <p className="text-[11px] text-slate-400">Target spending & budget limits in {currency}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('expenses')}
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {categorySpending.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No expenses recorded in this period. Tap "+ Expense" to record spending.
            </div>
          ) : (
            <div className="space-y-3">
              {categorySpending.slice(0, 5).map(item => {
                const totalPeriodExp = totalExpenseMinor > 0 ? totalExpenseMinor : 1;
                const percentageOfTotal = Math.round((item.spentMinor / totalPeriodExp) * 100);
                const budgetPercent = item.budgetMinor > 0 ? Math.round((item.spentMinor / item.budgetMinor) * 100) : null;
                const isOverBudget = budgetPercent !== null && budgetPercent > 100;

                return (
                  <div key={item.category.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${item.category.color}25`, color: item.category.color }}
                        >
                          <CategoryIcon iconName={item.category.icon} size={15} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white">{item.category.name}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {item.count} transaction(s) &bull; {percentageOfTotal}% of period
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-white block">
                          {formatMoney(item.spentMinor, currency)}
                        </span>
                        {item.budgetMinor > 0 && (
                          <span
                            className={`text-[10px] font-semibold ${
                              isOverBudget ? 'text-rose-400' : 'text-slate-400'
                            }`}
                          >
                            {isOverBudget ? `Over by ${budgetPercent - 100}%` : `${budgetPercent}% of monthly limit`}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, item.budgetMinor > 0 ? budgetPercent || percentageOfTotal : percentageOfTotal)}%`,
                          backgroundColor: isOverBudget ? '#f43f5e' : item.category.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions Stream */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Recent Activity</h2>
              <p className="text-[11px] text-slate-400">Latest deposits & payments in {currency}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {combinedRecent.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No transactions recorded for {currency} in this reporting period.
            </div>
          ) : (
            <div className="space-y-2.5">
              {combinedRecent.map(tx => {
                const isIncome = tx.type === 'INCOME';
                const cat = !isIncome ? categories.find(c => c.id === (tx as any).categoryId) : null;

                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-white truncate block">
                          {isIncome ? (tx as any).source : (tx as any).merchant}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {tx.date} &bull; {isIncome ? (tx as any).description || 'Deposit' : (tx as any).reason}
                          {cat ? ` &bull; ${cat.name}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-extrabold ${
                          isIncome ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatMoney(tx.amountMinor, currency)}
                      </span>
                      <span className="text-[10px] text-slate-500 block uppercase">
                        {tx.paymentMethod}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Tools Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <button
          type="button"
          onClick={() => {
            setDebtTypeToAdd('DEBIT');
            setShowAddDebt(true);
          }}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all"
        >
          <HandCoins className="w-4 h-4 text-rose-400 mb-1.5" />
          <span className="text-xs font-bold text-white block">+ Money I Owe</span>
          <span className="text-[10px] text-slate-400">Record a loan liability</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setDebtTypeToAdd('CREDIT');
            setShowAddDebt(true);
          }}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all"
        >
          <HandCoins className="w-4 h-4 text-emerald-400 mb-1.5" />
          <span className="text-xs font-bold text-white block">+ Money Owed Me</span>
          <span className="text-[10px] text-slate-400">Record receivable credit</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('budgets')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all"
        >
          <Wallet className="w-4 h-4 text-teal-400 mb-1.5" />
          <span className="text-xs font-bold text-white block">Budgets & Goals</span>
          <span className="text-[10px] text-slate-400">Track monthly caps</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('export')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all"
        >
          <Calendar className="w-4 h-4 text-cyan-400 mb-1.5" />
          <span className="text-xs font-bold text-white block">Excel Export</span>
          <span className="text-[10px] text-slate-400">9-Sheet XLSX download</span>
        </button>
      </div>

      {/* Official Developer Credit Footer placed strictly at the bottom of the scrollable content */}
      <Footer />

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          isOpen={showAddExpense}
          onClose={() => setShowAddExpense(false)}
        />
      )}

      {showAddIncome && (
        <AddIncomeModal
          isOpen={showAddIncome}
          onClose={() => setShowAddIncome(false)}
        />
      )}

      {showAddDebt && (
        <AddDebtModal
          isOpen={showAddDebt}
          onClose={() => setShowAddDebt(false)}
          initialType={debtTypeToAdd}
        />
      )}

      {showAddCategory && (
        <CategoryModal
          isOpen={showAddCategory}
          onClose={() => setShowAddCategory(false)}
        />
      )}
    </div>
  );
};
