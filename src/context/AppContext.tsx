/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FinTech application context and reactive state management.
 * Enforces strict AED and INR currency isolation.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  AppSettings,
  BudgetRecord,
  Category,
  Currency,
  DebtRecord,
  DebtStatus,
  ExpenseRecord,
  IncomeRecord,
  ReminderRecord,
  ReminderStatus,
  RepaymentRecord,
  SavingsGoal,
  AttachmentRecord,
  TimePeriod,
} from '../types';
import { StorageService } from '../db/storage';
import { getPeriodDateRange, isWithinDateRange, calculateOutstandingDebt } from '../utils/money';
import { executeAtomicRestore, validateBackupContent } from '../utils/backupRestore';

interface AppContextType {
  // State
  currency: Currency;
  setCurrency: (c: Currency) => void;
  period: TimePeriod;
  setPeriod: (p: TimePeriod) => void;
  customRange: { start: string; end: string };
  setCustomRange: (range: { start: string; end: string }) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Active Currency Filtered Entities
  categories: Category[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  debts: DebtRecord[];
  repayments: RepaymentRecord[];
  reminders: ReminderRecord[];
  savingsGoals: SavingsGoal[];
  budgets: BudgetRecord[];
  attachments: AttachmentRecord[];

  // Period Filtered Financial Movements
  periodIncomes: IncomeRecord[];
  periodExpenses: ExpenseRecord[];

  // Real-time Calculated Financial Totals for Active Currency & Period
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  netBalanceMinor: number;
  totalDebtOwedMinor: number;
  totalCreditReceivableMinor: number;
  upcomingRemindersCount: number;
  overdueRemindersCount: number;

  // Actions
  addCategory: (cat: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isCustom' | 'isArchived' | 'currency'>) => { success: boolean; error?: string; newCategory?: Category };
  updateCategory: (cat: Category) => { success: boolean; error?: string };
  archiveCategory: (categoryId: string) => void;
  deleteCategory: (categoryId: string, reassignToCategoryId?: string) => { success: boolean; error?: string };

  addIncome: (income: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt' | 'currency'>) => void;
  updateIncome: (income: IncomeRecord) => void;
  deleteIncome: (id: string) => void;

  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt' | 'currency'>) => void;
  updateExpense: (expense: ExpenseRecord) => void;
  deleteExpense: (id: string) => void;

  addDebt: (debt: Omit<DebtRecord, 'id' | 'createdAt' | 'updatedAt' | 'currency' | 'status'>) => void;
  updateDebt: (debt: DebtRecord) => void;
  deleteDebt: (id: string) => void;

  addRepayment: (repayment: Omit<RepaymentRecord, 'id' | 'createdAt' | 'currency'>) => { success: boolean; error?: string };
  deleteRepayment: (id: string) => void;

  addReminder: (reminder: Omit<ReminderRecord, 'id' | 'createdAt' | 'updatedAt' | 'currency' | 'status'>) => void;
  updateReminder: (reminder: ReminderRecord) => void;
  deleteReminder: (id: string) => void;
  toggleReminderComplete: (id: string) => void;

  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'currency'>) => void;
  updateSavingsGoal: (goal: SavingsGoal) => void;
  contributeToGoal: (id: string, amountMinor: number) => void;
  deleteSavingsGoal: (id: string) => void;

  addAttachment: (attachment: Omit<AttachmentRecord, 'id' | 'createdAt'>) => void;
  deleteAttachment: (id: string) => void;
  getAttachmentsForRecord: (recordId: string) => AttachmentRecord[];

  // Backup & Reset
  refreshFromStorage: () => void;
  restoreBackupData: (jsonStr: string, mode: 'MERGE' | 'REPLACE') => { success: boolean; message: string };
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure database seed data is present before evaluating initial state
  StorageService.initializeDatabaseIfEmpty();

  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [currency, setCurrencyState] = useState<Currency>(() => settings.defaultCurrency || 'AED');
  const [period, setPeriod] = useState<TimePeriod>('THIS_MONTH');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>(() => {
    const today = new Date().toISOString().split('T')[0];
    return { start: today.substring(0, 7) + '-01', end: today };
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Raw Database Entities
  const [allCategories, setAllCategories] = useState<Category[]>(() => StorageService.getCategories());
  const [allIncomes, setAllIncomes] = useState<IncomeRecord[]>(() => StorageService.getIncomes());
  const [allExpenses, setAllExpenses] = useState<ExpenseRecord[]>(() => StorageService.getExpenses());
  const [allDebts, setAllDebts] = useState<DebtRecord[]>(() => StorageService.getDebts());
  const [allRepayments, setAllRepayments] = useState<RepaymentRecord[]>(() => StorageService.getRepayments());
  const [allReminders, setAllReminders] = useState<ReminderRecord[]>(() => StorageService.getReminders());
  const [allBudgets, setAllBudgets] = useState<BudgetRecord[]>(() => StorageService.getBudgets());
  const [allSavingsGoals, setAllSavingsGoals] = useState<SavingsGoal[]>(() => StorageService.getSavingsGoals());
  const [allAttachments, setAllAttachments] = useState<AttachmentRecord[]>(() => StorageService.getAttachments());

  // Save changes to storage when modified
  const persistCategories = (items: Category[]) => {
    setAllCategories(items);
    StorageService.saveCategories(items);
  };
  const persistAttachments = (items: AttachmentRecord[]) => {
    setAllAttachments(items);
    StorageService.saveAttachments(items);
  };
  const persistIncomes = (items: IncomeRecord[]) => {
    setAllIncomes(items);
    StorageService.saveIncomes(items);
  };
  const persistExpenses = (items: ExpenseRecord[]) => {
    setAllExpenses(items);
    StorageService.saveExpenses(items);
  };
  const persistDebts = (items: DebtRecord[]) => {
    setAllDebts(items);
    StorageService.saveDebts(items);
  };
  const persistRepayments = (items: RepaymentRecord[]) => {
    setAllRepayments(items);
    StorageService.saveRepayments(items);
  };
  const persistReminders = (items: ReminderRecord[]) => {
    setAllReminders(items);
    StorageService.saveReminders(items);
  };
  const persistBudgets = (items: BudgetRecord[]) => {
    setAllBudgets(items);
    StorageService.saveBudgets(items);
  };
  const persistSavingsGoals = (items: SavingsGoal[]) => {
    setAllSavingsGoals(items);
    StorageService.saveSavingsGoals(items);
  };

  const updateSettings = (newPartial: Partial<AppSettings>) => {
    const updated = { ...settings, ...newPartial };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
  };

  // Filter entities by active currency
  const currencyCategories = useMemo(() => {
    return allCategories.filter(c => c.currency === currency && !c.isArchived);
  }, [allCategories, currency]);

  const currencyIncomes = useMemo(() => {
    return allIncomes.filter(i => i.currency === currency);
  }, [allIncomes, currency]);

  const currencyExpenses = useMemo(() => {
    return allExpenses.filter(e => e.currency === currency);
  }, [allExpenses, currency]);

  const currencyDebts = useMemo(() => {
    return allDebts.filter(d => d.currency === currency);
  }, [allDebts, currency]);

  const currencyRepayments = useMemo(() => {
    return allRepayments.filter(r => r.currency === currency);
  }, [allRepayments, currency]);

  const currencyReminders = useMemo(() => {
    return allReminders.filter(r => r.currency === currency);
  }, [allReminders, currency]);

  const currencySavingsGoals = useMemo(() => {
    return allSavingsGoals.filter(s => s.currency === currency);
  }, [allSavingsGoals, currency]);

  const currencyBudgets = useMemo(() => {
    return allBudgets.filter(b => b.currency === currency);
  }, [allBudgets, currency]);

  const currencyAttachments = useMemo(() => {
    return allAttachments.filter(a => a.currency === currency);
  }, [allAttachments, currency]);

  // Date range filtering
  const activeDateRange = useMemo(() => {
    return getPeriodDateRange(period, customRange);
  }, [period, customRange]);

  const periodIncomes = useMemo(() => {
    return currencyIncomes.filter(inc => isWithinDateRange(inc.date, activeDateRange.startDate, activeDateRange.endDate));
  }, [currencyIncomes, activeDateRange]);

  const periodExpenses = useMemo(() => {
    return currencyExpenses.filter(exp => isWithinDateRange(exp.date, activeDateRange.startDate, activeDateRange.endDate));
  }, [currencyExpenses, activeDateRange]);

  // Financial Totals calculated safely in minor units
  const totalIncomeMinor = useMemo(() => {
    return periodIncomes.reduce((acc, curr) => acc + curr.amountMinor, 0);
  }, [periodIncomes]);

  const totalExpenseMinor = useMemo(() => {
    return periodExpenses.reduce((acc, curr) => acc + curr.amountMinor, 0);
  }, [periodExpenses]);

  const netBalanceMinor = useMemo(() => {
    return totalIncomeMinor - totalExpenseMinor;
  }, [totalIncomeMinor, totalExpenseMinor]);

  // Debts & Credits Totals
  const totalDebtOwedMinor = useMemo(() => {
    return currencyDebts
      .filter(d => d.type === 'DEBIT')
      .reduce((acc, d) => {
        const { outstandingMinor } = calculateOutstandingDebt(d, currencyRepayments);
        return acc + outstandingMinor;
      }, 0);
  }, [currencyDebts, currencyRepayments]);

  const totalCreditReceivableMinor = useMemo(() => {
    return currencyDebts
      .filter(d => d.type === 'CREDIT')
      .reduce((acc, d) => {
        const { outstandingMinor } = calculateOutstandingDebt(d, currencyRepayments);
        return acc + outstandingMinor;
      }, 0);
  }, [currencyDebts, currencyRepayments]);

  // Reminders metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingRemindersCount = useMemo(() => {
    return currencyReminders.filter(r => r.status !== 'COMPLETED' && r.dueDate >= todayStr).length;
  }, [currencyReminders, todayStr]);

  const overdueRemindersCount = useMemo(() => {
    return currencyReminders.filter(r => r.status !== 'COMPLETED' && r.dueDate < todayStr).length;
  }, [currencyReminders, todayStr]);

  // Category Actions
  const addCategory = (catData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isCustom' | 'isArchived' | 'currency'>) => {
    const trimmedName = catData.name.trim();
    if (!trimmedName) {
      return { success: false, error: 'Category name is required.' };
    }

    // Check duplicate in current currency (case-insensitive)
    const exists = allCategories.some(
      c => c.currency === currency && !c.isArchived && c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      return { success: false, error: `A category named "${trimmedName}" already exists for ${currency}.` };
    }

    const now = Date.now();
    const newCategory: Category = {
      ...catData,
      id: `cat_custom_${currency.toLowerCase()}_${now}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      currency: currency,
      isCustom: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    persistCategories([...allCategories, newCategory]);
    return { success: true, newCategory };
  };

  const updateCategory = (cat: Category) => {
    const trimmedName = cat.name.trim();
    if (!trimmedName) {
      return { success: false, error: 'Category name cannot be empty.' };
    }

    // Check duplicate among other categories
    const exists = allCategories.some(
      c => c.id !== cat.id && c.currency === cat.currency && !c.isArchived && c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      return { success: false, error: `A category named "${trimmedName}" already exists for ${cat.currency}.` };
    }

    const updatedList = allCategories.map(c => (c.id === cat.id ? { ...cat, updatedAt: Date.now() } : c));
    persistCategories(updatedList);
    return { success: true };
  };

  const archiveCategory = (categoryId: string) => {
    const updated = allCategories.map(c => (c.id === categoryId ? { ...c, isArchived: true, updatedAt: Date.now() } : c));
    persistCategories(updated);
  };

  const deleteCategory = (categoryId: string, reassignToCategoryId?: string) => {
    const expensesWithCat = allExpenses.filter(e => e.categoryId === categoryId);
    if (expensesWithCat.length > 0) {
      if (!reassignToCategoryId) {
        return {
          success: false,
          error: `This category has ${expensesWithCat.length} expense(s). Please choose another category to reassign them to, or archive instead.`,
        };
      }

      // Reassign expenses
      const reassignedExpenses = allExpenses.map(e =>
        e.categoryId === categoryId ? { ...e, categoryId: reassignToCategoryId, updatedAt: Date.now() } : e
      );
      persistExpenses(reassignedExpenses);
    }

    // Clean up category attachments
    persistAttachments(allAttachments.filter(a => a.recordId !== categoryId));
    persistCategories(allCategories.filter(c => c.id !== categoryId));
    return { success: true };
  };

  // Income Actions
  const addIncome = (incData: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt' | 'currency'>) => {
    const now = Date.now();
    const newInc: IncomeRecord = {
      ...incData,
      id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      currency: currency,
      createdAt: now,
      updatedAt: now,
    };
    persistIncomes([newInc, ...allIncomes]);
  };

  const updateIncome = (income: IncomeRecord) => {
    const updated = allIncomes.map(i => (i.id === income.id ? { ...income, updatedAt: Date.now() } : i));
    persistIncomes(updated);
  };

  const deleteIncome = (id: string) => {
    persistIncomes(allIncomes.filter(i => i.id !== id));
    persistAttachments(allAttachments.filter(a => a.recordId !== id));
  };

  // Expense Actions
  const addExpense = (expData: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt' | 'currency'>) => {
    const now = Date.now();
    const newExp: ExpenseRecord = {
      ...expData,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      currency: currency,
      createdAt: now,
      updatedAt: now,
    };
    persistExpenses([newExp, ...allExpenses]);
  };

  const updateExpense = (expense: ExpenseRecord) => {
    const updated = allExpenses.map(e => (e.id === expense.id ? { ...expense, updatedAt: Date.now() } : e));
    persistExpenses(updated);
  };

  const deleteExpense = (id: string) => {
    persistExpenses(allExpenses.filter(e => e.id !== id));
    persistAttachments(allAttachments.filter(a => a.recordId !== id));
  };

  // Debt Actions
  const addDebt = (debtData: Omit<DebtRecord, 'id' | 'createdAt' | 'updatedAt' | 'currency' | 'status'>) => {
    const now = Date.now();
    const newDebt: DebtRecord = {
      ...debtData,
      id: `debt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      currency: currency,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    persistDebts([newDebt, ...allDebts]);
  };

  const updateDebt = (debt: DebtRecord) => {
    const updated = allDebts.map(d => (d.id === debt.id ? { ...debt, updatedAt: Date.now() } : d));
    persistDebts(updated);
  };

  const deleteDebt = (id: string) => {
    const debtRepayments = allRepayments.filter(r => r.debtId === id);
    const repaymentIds = new Set(debtRepayments.map(r => r.id));

    persistDebts(allDebts.filter(d => d.id !== id));
    persistRepayments(allRepayments.filter(r => r.debtId !== id));
    persistReminders(allReminders.filter(rem => rem.relatedDebtId !== id));
    // Cascade delete attachments for debt and its repayments
    persistAttachments(allAttachments.filter(a => a.recordId !== id && !repaymentIds.has(a.recordId)));
  };

  // Repayment Actions
  const addRepayment = (repayData: Omit<RepaymentRecord, 'id' | 'createdAt' | 'currency'>) => {
    const debt = allDebts.find(d => d.id === repayData.debtId);
    if (!debt) {
      return { success: false, error: 'Related debt/credit record not found.' };
    }

    const { outstandingMinor } = calculateOutstandingDebt(debt, allRepayments);
    if (repayData.amountMinor > outstandingMinor) {
      return {
        success: false,
        error: `Repayment amount cannot exceed the remaining outstanding balance (${outstandingMinor / 100} ${debt.currency}).`,
      };
    }

    const newRepay: RepaymentRecord = {
      ...repayData,
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      currency: debt.currency,
      createdAt: Date.now(),
    };

    const updatedRepayments = [newRepay, ...allRepayments];
    persistRepayments(updatedRepayments);

    // Update debt status
    const newCalc = calculateOutstandingDebt(debt, updatedRepayments);
    const newStatus: DebtStatus = newCalc.isFullyPaid ? 'FULLY_PAID' : 'PARTIALLY_PAID';
    const updatedDebts = allDebts.map(d => (d.id === debt.id ? { ...d, status: newStatus, updatedAt: Date.now() } : d));
    persistDebts(updatedDebts);

    return { success: true };
  };

  const deleteRepayment = (id: string) => {
    const repay = allRepayments.find(r => r.id === id);
    const remaining = allRepayments.filter(r => r.id !== id);
    persistRepayments(remaining);
    persistAttachments(allAttachments.filter(a => a.recordId !== id));

    if (repay) {
      const debt = allDebts.find(d => d.id === repay.debtId);
      if (debt) {
        const newCalc = calculateOutstandingDebt(debt, remaining);
        const newStatus: DebtStatus = newCalc.outstandingMinor === debt.originalAmountMinor ? 'ACTIVE' : newCalc.isFullyPaid ? 'FULLY_PAID' : 'PARTIALLY_PAID';
        const updatedDebts = allDebts.map(d => (d.id === debt.id ? { ...d, status: newStatus, updatedAt: Date.now() } : d));
        persistDebts(updatedDebts);
      }
    }
  };

  // Reminders Actions
  const addReminder = (remData: Omit<ReminderRecord, 'id' | 'createdAt' | 'updatedAt' | 'currency' | 'status'>) => {
    const now = Date.now();
    const newRem: ReminderRecord = {
      ...remData,
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      currency: currency,
      status: 'UPCOMING',
      createdAt: now,
      updatedAt: now,
    };
    persistReminders([newRem, ...allReminders]);
  };

  const updateReminder = (reminder: ReminderRecord) => {
    const updated = allReminders.map(r => (r.id === reminder.id ? { ...reminder, updatedAt: Date.now() } : r));
    persistReminders(updated);
  };

  const deleteReminder = (id: string) => {
    persistReminders(allReminders.filter(r => r.id !== id));
  };

  const toggleReminderComplete = (id: string) => {
    const updated = allReminders.map(r => {
      if (r.id === id) {
        const newStatus: ReminderStatus = r.status === 'COMPLETED' ? 'UPCOMING' : 'COMPLETED';
        return { ...r, status: newStatus, updatedAt: Date.now() };
      }
      return r;
    });
    persistReminders(updated);
  };

  // Savings Goals Actions
  const addSavingsGoal = (goalData: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'currency'>) => {
    const now = Date.now();
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `sav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      currency: currency,
      createdAt: now,
      updatedAt: now,
    };
    persistSavingsGoals([newGoal, ...allSavingsGoals]);
  };

  const updateSavingsGoal = (goal: SavingsGoal) => {
    const updated = allSavingsGoals.map(g => (g.id === goal.id ? { ...goal, updatedAt: Date.now() } : g));
    persistSavingsGoals(updated);
  };

  const contributeToGoal = (id: string, amountMinor: number) => {
    const updated = allSavingsGoals.map(g => {
      if (g.id === id) {
        const newCurrent = Math.max(0, g.currentAmountMinor + amountMinor);
        return { ...g, currentAmountMinor: newCurrent, updatedAt: Date.now() };
      }
      return g;
    });
    persistSavingsGoals(updated);
  };

  const deleteSavingsGoal = (id: string) => {
    persistSavingsGoals(allSavingsGoals.filter(g => g.id !== id));
  };

  // Attachment Actions
  const addAttachment = (attData: Omit<AttachmentRecord, 'id' | 'createdAt'>) => {
    const newAtt: AttachmentRecord = {
      ...attData,
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    persistAttachments([newAtt, ...allAttachments]);
  };

  const deleteAttachment = (id: string) => {
    persistAttachments(allAttachments.filter(a => a.id !== id));
  };

  const getAttachmentsForRecord = (recordId: string): AttachmentRecord[] => {
    return allAttachments.filter(a => a.recordId === recordId);
  };

  // Backup & Reset Actions
  const refreshFromStorage = () => {
    setAllCategories(StorageService.getCategories());
    setAllIncomes(StorageService.getIncomes());
    setAllExpenses(StorageService.getExpenses());
    setAllDebts(StorageService.getDebts());
    setAllRepayments(StorageService.getRepayments());
    setAllReminders(StorageService.getReminders());
    setAllBudgets(StorageService.getBudgets());
    setAllSavingsGoals(StorageService.getSavingsGoals());
    setAllAttachments(StorageService.getAttachments());
    setSettings(StorageService.getSettings());
  };

  const restoreBackupData = (jsonStr: string, mode: 'MERGE' | 'REPLACE') => {
    const validation = validateBackupContent(jsonStr, { filename: 'backup.json', size: jsonStr.length });
    if (!validation.valid || !validation.parsedData) {
      return {
        success: false,
        message: validation.errors.length > 0 ? validation.errors.join('; ') : 'Invalid backup data.',
      };
    }
    const result = executeAtomicRestore(validation.parsedData, mode);
    if (result.success) {
      refreshFromStorage();
    }
    return result;
  };

  const resetAllData = () => {
    StorageService.clearAllData();
    refreshFromStorage();
  };

  const value: AppContextType = {
    currency,
    setCurrency,
    period,
    setPeriod,
    customRange,
    setCustomRange,
    searchQuery,
    setSearchQuery,
    settings,
    updateSettings,
    categories: currencyCategories,
    incomes: currencyIncomes,
    expenses: currencyExpenses,
    debts: currencyDebts,
    repayments: currencyRepayments,
    reminders: currencyReminders,
    savingsGoals: currencySavingsGoals,
    budgets: currencyBudgets,
    attachments: currencyAttachments,
    periodIncomes,
    periodExpenses,
    totalIncomeMinor,
    totalExpenseMinor,
    netBalanceMinor,
    totalDebtOwedMinor,
    totalCreditReceivableMinor,
    upcomingRemindersCount,
    overdueRemindersCount,
    addCategory,
    updateCategory,
    archiveCategory,
    deleteCategory,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addDebt,
    updateDebt,
    deleteDebt,
    addRepayment,
    deleteRepayment,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderComplete,
    addSavingsGoal,
    updateSavingsGoal,
    contributeToGoal,
    deleteSavingsGoal,
    addAttachment,
    deleteAttachment,
    getAttachmentsForRecord,
    refreshFromStorage,
    restoreBackupData,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
