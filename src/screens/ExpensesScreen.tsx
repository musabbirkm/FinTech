/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Expenses Screen: Full expense management, category analytics, inline editing, and category manager.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Category, ExpenseRecord } from '../types';
import { formatMoney, toMajorUnits } from '../utils/money';
import { CategoryIcon } from '../components/CategoryIcon';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { CategoryModal } from '../components/CategoryModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AttachmentManager } from '../components/AttachmentManager';
import { Footer } from '../components/Footer';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit2,
  FolderPlus,
  Settings,
  AlertTriangle,
  Archive,
  Layers,
  ChevronDown,
  Paperclip,
  X,
} from 'lucide-react';

export const ExpensesScreen: React.FC = () => {
  const {
    currency,
    categories,
    periodExpenses,
    totalExpenseMinor,
    searchQuery,
    attachments,
    deleteExpense,
    archiveCategory,
    deleteCategory,
  } = useApp();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  // Modals for Deletion and Attachments
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);
  const [categoryToArchive, setCategoryToArchive] = useState<Category | null>(null);
  const [selectedExpenseForAttachments, setSelectedExpenseForAttachments] = useState<ExpenseRecord | null>(null);

  // Category Manager Drawer / Modal state
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false);
  const [reassignTargetCatId, setReassignTargetCatId] = useState<string>('');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filter expenses by search query and category
  const filteredExpenses = useMemo(() => {
    let list = periodExpenses;

    if (selectedCategoryId !== 'ALL') {
      list = list.filter(e => e.categoryId === selectedCategoryId);
    }

    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (trimmedQuery) {
      list = list.filter(e => {
        const cat = categories.find(c => c.id === e.categoryId);
        const catName = cat ? cat.name.toLowerCase() : '';
        const majorAmount = (e.amountMinor / 100).toString();
        const formattedAmt = formatMoney(e.amountMinor, currency).toLowerCase();

        return (
          e.merchant.toLowerCase().includes(trimmedQuery) ||
          e.reason.toLowerCase().includes(trimmedQuery) ||
          catName.includes(trimmedQuery) ||
          majorAmount.includes(trimmedQuery) ||
          formattedAmt.includes(trimmedQuery) ||
          (e.notes && e.notes.toLowerCase().includes(trimmedQuery)) ||
          (e.tags && e.tags.some(t => t.toLowerCase().includes(trimmedQuery)))
        );
      });
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      if (sortBy === 'amount_desc') return b.amountMinor - a.amountMinor;
      if (sortBy === 'amount_asc') return a.amountMinor - b.amountMinor;
      return 0;
    });
  }, [periodExpenses, selectedCategoryId, searchQuery, sortBy, categories, currency]);

  // Highest spending category
  const categoryStats = useMemo(() => {
    const map = new Map<string, { spentMinor: number; count: number }>();
    for (const exp of periodExpenses) {
      const current = map.get(exp.categoryId) || { spentMinor: 0, count: 0 };
      map.set(exp.categoryId, {
        spentMinor: current.spentMinor + exp.amountMinor,
        count: current.count + 1,
      });
    }
    return map;
  }, [periodExpenses]);

  const highestSpendingCategory = useMemo(() => {
    let topCat: Category | null = null;
    let maxSpent = -1;
    for (const cat of categories) {
      const stat = categoryStats.get(cat.id);
      if (stat && stat.spentMinor > maxSpent) {
        maxSpent = stat.spentMinor;
        topCat = cat;
      }
    }
    return { category: topCat, amountMinor: maxSpent > 0 ? maxSpent : 0 };
  }, [categories, categoryStats]);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen px-4 py-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Expense Management
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {currency} Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Track daily operating expenses, merchant receipts, and category allocations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCategoryManager(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>Manage Categories</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Spending ({currency})
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-rose-400 block mt-1">
            {formatMoney(totalExpenseMinor, currency)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {periodExpenses.length} transaction(s) recorded
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Highest Spending Category
          </span>
          <div className="flex items-center gap-2 mt-1">
            {highestSpendingCategory.category ? (
              <>
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${highestSpendingCategory.category.color}25`,
                    color: highestSpendingCategory.category.color,
                  }}
                >
                  <CategoryIcon iconName={highestSpendingCategory.category.icon} size={13} />
                </div>
                <span className="text-base font-bold text-white truncate">
                  {highestSpendingCategory.category.name}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-slate-500">None yet</span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {highestSpendingCategory.category ? formatMoney(highestSpendingCategory.amountMinor, currency) : 'No expenses'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Categories Configured
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-white block mt-1">
            {categories.length}
          </span>
          <span className="text-[11px] text-emerald-400 mt-1 block font-medium">
            Strict {currency} isolation
          </span>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategoryId === 'ALL'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Categories ({periodExpenses.length})
          </button>
          {categories.map(cat => {
            const count = categoryStats.get(cat.id)?.count || 0;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-bold border'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
                {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="date_desc">Newest Date</option>
            <option value="date_asc">Oldest Date</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <TrendingDown className="w-10 h-10 mx-auto mb-3 opacity-30 text-rose-400" />
            <p className="text-sm font-semibold text-slate-300">No expenses found</p>
            <p className="text-xs text-slate-500 mt-1">
              Adjust filters or record a new expense in {currency}
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setShowAddModal(true);
              }}
              className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-md"
            >
              + Record Expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredExpenses.map(exp => {
              const cat = catMap.get(exp.categoryId);
              return (
                <div
                  key={exp.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: cat ? `${cat.color}20` : '#334155',
                        color: cat ? cat.color : '#94a3b8',
                      }}
                    >
                      <CategoryIcon iconName={cat ? cat.icon : 'Folder'} size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{exp.merchant}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {cat ? cat.name : 'Uncategorized'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{exp.reason}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>{exp.date}</span>
                        <span>&bull;</span>
                        <span className="uppercase">{exp.paymentMethod}</span>
                        {exp.tags && exp.tags.length > 0 && (
                          <>
                            <span>&bull;</span>
                            <span className="text-slate-400">#{exp.tags.join(' #')}</span>
                          </>
                        )}
                        {exp.notes && (
                          <>
                            <span>&bull;</span>
                            <span className="italic text-slate-400">"{exp.notes}"</span>
                          </>
                        )}
                      </div>

                      {/* Attachment Badge / Trigger */}
                      <div className="mt-1.5 flex items-center gap-2">
                        {(() => {
                          const expAtts = attachments.filter(a => a.recordId === exp.id);
                          return (
                            <button
                              type="button"
                              onClick={() => setSelectedExpenseForAttachments(exp)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700/60 transition-colors"
                              title="Manage Receipts & Attachments"
                              aria-label={`Manage receipts for ${exp.merchant}`}
                            >
                              <Paperclip className="w-3 h-3 text-emerald-400" />
                              <span>{expAtts.length > 0 ? `${expAtts.length} file(s)` : 'Attach receipt'}</span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <span className="text-base font-extrabold text-rose-400">
                      -{formatMoney(exp.amountMinor, currency)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingExpense(exp);
                          setShowAddModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Expense"
                        aria-label="Edit expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(exp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Expense"
                        aria-label="Delete expense"
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

      {/* Category Management Drawer Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-5 shadow-2xl my-auto text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Category Manager ({currency})
                </h2>
                <p className="text-xs text-slate-400">
                  Custom categories, monthly budgets, and safe archival
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryManager(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-slate-300">
                Active Categories ({categories.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryEditModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New Category</span>
              </button>
            </div>

            <div className="space-y-2">
              {categories.map(cat => {
                const stat = categoryStats.get(cat.id) || { spentMinor: 0, count: 0 };
                return (
                  <div
                    key={cat.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                      >
                        <CategoryIcon iconName={cat.icon} size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{cat.name}</span>
                          {cat.isCustom ? (
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-semibold border border-cyan-500/30">
                              Custom
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-medium">
                              Standard
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {stat.count} expense(s) recorded &bull; {formatMoney(stat.spentMinor, currency)}
                          {cat.monthlyBudgetMinor ? ` &bull; Budget: ${toMajorUnits(cat.monthlyBudgetMinor, currency)} ${currency}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setShowCategoryEditModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryToArchive(cat)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-amber-500/10"
                        title="Archive Category"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryToDelete(cat);
                          setReassignTargetCatId(categories.find(c => c.id !== cat.id)?.id || '');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Safe Category Deletion Dialog with Reassignment Option */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl text-slate-100">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Safe Deletion of "{categoryToDelete.name}"
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              To preserve accurate financial history, you cannot silently delete a category that contains expenses.
            </p>
            {deleteError && (
              <div className="mb-3 p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                {deleteError}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Reassign existing expenses to:
              </label>
              <select
                value={reassignTargetCatId}
                onChange={e => setReassignTargetCatId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {categories
                  .filter(c => c.id !== categoryToDelete.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategoryToDelete(null);
                  setDeleteError(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = deleteCategory(categoryToDelete.id, reassignTargetCatId);
                  if (!res.success) {
                    setDeleteError(res.error || 'Failed to delete category');
                  } else {
                    setCategoryToDelete(null);
                    setDeleteError(null);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-xl"
              >
                Reassign & Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Expense */}
      {expenseToDelete && (
        <ConfirmDialog
          isOpen={!!expenseToDelete}
          title="Delete Expense Record"
          message={`Are you sure you want to permanently delete this expense of ${formatMoney(expenseToDelete.amountMinor, currency)} at ${expenseToDelete.merchant}?`}
          subMessage="Associated receipt attachments will also be removed. Account totals and category budgets will update immediately."
          confirmText="Delete Expense"
          variant="danger"
          onConfirm={() => {
            deleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
          }}
          onClose={() => setExpenseToDelete(null)}
        />
      )}

      {/* Confirmation Dialog for Archiving Category */}
      {categoryToArchive && (
        <ConfirmDialog
          isOpen={!!categoryToArchive}
          title="Archive Category"
          message={`Archive "${categoryToArchive.name}" for ${currency}?`}
          subMessage="Historical expenses linked to this category will be preserved, but it will be hidden from new transaction forms."
          confirmText="Archive Category"
          variant="warning"
          onConfirm={() => {
            archiveCategory(categoryToArchive.id);
            setCategoryToArchive(null);
          }}
          onClose={() => setCategoryToArchive(null)}
        />
      )}

      {/* Attachments Manager Modal for Expense */}
      {selectedExpenseForAttachments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-emerald-400" />
                  Receipts & Attachments
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedExpenseForAttachments.merchant} &bull; {formatMoney(selectedExpenseForAttachments.amountMinor, currency)} &bull; {selectedExpenseForAttachments.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExpenseForAttachments(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <AttachmentManager
              recordId={selectedExpenseForAttachments.id}
              recordType="EXPENSE"
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddExpenseModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingExpense(null);
          }}
          editingExpense={editingExpense}
        />
      )}

      {showCategoryEditModal && (
        <CategoryModal
          isOpen={showCategoryEditModal}
          onClose={() => {
            setShowCategoryEditModal(false);
            setEditingCategory(null);
          }}
          editingCategory={editingCategory}
        />
      )}

      <Footer />
    </div>
  );
};
