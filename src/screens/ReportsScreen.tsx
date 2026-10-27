/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Financial Analytics & Reports Screen.
 * Visual charts, category distributions, income streams, and cash-flow metrics.
 */

import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatMoney, toMajorUnits, calculateOutstandingDebt } from '../utils/money';
import { CategoryIcon } from '../components/CategoryIcon';
import { Footer } from '../components/Footer';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const {
    currency,
    period,
    periodIncomes,
    periodExpenses,
    totalIncomeMinor,
    totalExpenseMinor,
    netBalanceMinor,
    categories,
    debts,
    repayments,
  } = useApp();

  // Category distribution
  const categoryStats = useMemo(() => {
    return categories
      .map(cat => {
        const catExpenses = periodExpenses.filter(e => e.categoryId === cat.id);
        const spentMinor = catExpenses.reduce((sum, e) => sum + e.amountMinor, 0);
        return {
          category: cat,
          spentMinor,
          count: catExpenses.length,
          percentage: totalExpenseMinor > 0 ? Math.round((spentMinor / totalExpenseMinor) * 100) : 0,
        };
      })
      .filter(item => item.spentMinor > 0)
      .sort((a, b) => b.spentMinor - a.spentMinor);
  }, [categories, periodExpenses, totalExpenseMinor]);

  // Income sources distribution
  const incomeStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const inc of periodIncomes) {
      map.set(inc.source, (map.get(inc.source) || 0) + inc.amountMinor);
    }
    return Array.from(map.entries())
      .map(([source, amountMinor]) => ({
        source,
        amountMinor,
        percentage: totalIncomeMinor > 0 ? Math.round((amountMinor / totalIncomeMinor) * 100) : 0,
      }))
      .sort((a, b) => b.amountMinor - a.amountMinor);
  }, [periodIncomes, totalIncomeMinor]);

  // Top 5 largest expenses
  const topExpenses = useMemo(() => {
    return [...periodExpenses]
      .sort((a, b) => b.amountMinor - a.amountMinor)
      .slice(0, 5);
  }, [periodExpenses]);

  // Savings rate
  const savingsRate = useMemo(() => {
    if (totalIncomeMinor <= 0) return 0;
    return Math.max(0, Math.round((netBalanceMinor / totalIncomeMinor) * 100));
  }, [totalIncomeMinor, netBalanceMinor]);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Financial Analytics & Reports
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {currency} Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            In-depth spending distributions, cash flow health, and operational margins
          </p>
        </div>
      </div>

      {/* Cash Flow Performance Hero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Operational Inflow</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-400 block">
            {formatMoney(totalIncomeMinor, currency)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            100% genuine deposits in {currency}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Operational Outflow</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl font-extrabold text-rose-400 block">
            {formatMoney(totalExpenseMinor, currency)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Category-allocated spending
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Net Cash Retention</span>
            <Wallet className="w-4 h-4 text-teal-400" />
          </div>
          <span
            className={`text-2xl font-extrabold block ${
              netBalanceMinor >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(netBalanceMinor, currency)}
          </span>
          <span className="text-[11px] text-teal-400 mt-1 block font-bold">
            {savingsRate}% Retention / Savings Rate
          </span>
        </div>
      </div>

      {/* Main Analytical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Spending Breakdown Chart */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                Category Expense Share
              </h2>
              <p className="text-[11px] text-slate-400">Total volume divided across active categories</p>
            </div>
            <span className="text-xs font-extrabold text-white">
              {formatMoney(totalExpenseMinor, currency)}
            </span>
          </div>

          {categoryStats.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No expenses recorded in {currency} for this period.
            </div>
          ) : (
            <div className="space-y-3.5">
              {categoryStats.map(item => (
                <div key={item.category.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.category.color}25`, color: item.category.color }}
                      >
                        <CategoryIcon iconName={item.category.icon} size={12} />
                      </div>
                      <span className="font-semibold text-slate-200">{item.category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">
                        {formatMoney(item.spentMinor, currency)}
                      </span>
                      <span className="text-[11px] text-slate-400 w-10 text-right font-medium">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Income Sources Share */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Income Stream Distribution
              </h2>
              <p className="text-[11px] text-slate-400">Deposits grouped by income origin</p>
            </div>
            <span className="text-xs font-extrabold text-emerald-400">
              {formatMoney(totalIncomeMinor, currency)}
            </span>
          </div>

          {incomeStats.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No income recorded in {currency} for this period.
            </div>
          ) : (
            <div className="space-y-3.5">
              {incomeStats.map(item => (
                <div key={item.source}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">{item.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-400">
                        {formatMoney(item.amountMinor, currency)}
                      </span>
                      <span className="text-[11px] text-slate-400 w-10 text-right font-medium">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Expense Transactions */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-8">
        <h2 className="text-sm font-bold text-white mb-1">Highest Single Expense Transactions</h2>
        <p className="text-[11px] text-slate-400 mb-4">
          Largest individual outflows for period in {currency}
        </p>

        {topExpenses.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">No expenses recorded.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {topExpenses.map(exp => {
              const cat = catMap.get(exp.categoryId);
              return (
                <div key={exp.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat ? `${cat.color}25` : '#334155', color: cat?.color || '#94a3b8' }}
                    >
                      <CategoryIcon iconName={cat?.icon || 'Folder'} size={14} />
                    </div>
                    <div>
                      <span className="font-bold text-white">{exp.merchant}</span>
                      <span className="text-[11px] text-slate-400 block">
                        {exp.reason} &bull; {cat?.name} &bull; {exp.date}
                      </span>
                    </div>
                  </div>
                  <span className="font-extrabold text-rose-400">
                    -{formatMoney(exp.amountMinor, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};
