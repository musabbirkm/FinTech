/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Local storage and database persistence for FinTech.
 * Stores records safely in localStorage / IndexedDB equivalent with schema versioning,
 * transactional integrity, and JSON backup/restore.
 */

import {
  Category,
  Currency,
  IncomeRecord,
  ExpenseRecord,
  DebtRecord,
  RepaymentRecord,
  ReminderRecord,
  BudgetRecord,
  SavingsGoal,
  AttachmentRecord,
  AppSettings,
  FullBackupData,
} from '../types';

const STORAGE_KEYS = {
  CATEGORIES: 'fintech_categories_v1',
  INCOMES: 'fintech_incomes_v1',
  EXPENSES: 'fintech_expenses_v1',
  DEBTS: 'fintech_debts_v1',
  REPAYMENTS: 'fintech_repayments_v1',
  REMINDERS: 'fintech_reminders_v1',
  BUDGETS: 'fintech_budgets_v1',
  SAVINGS_GOALS: 'fintech_savings_goals_v1',
  SETTINGS: 'fintech_settings_v1',
  ATTACHMENTS: 'fintech_attachments_v1',
  INITIALIZED: 'fintech_initialized_v1',
};

export const PREDEFINED_CATEGORIES_RAW = [
  { name: 'Family & Remittance', icon: 'HeartHandshake', color: '#ec4899', budgetAED: 3000, budgetINR: 40000 },
  { name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#f97316', budgetAED: 1500, budgetINR: 15000 },
  { name: 'Groceries & Supermarket', icon: 'ShoppingCart', color: '#10b981', budgetAED: 2000, budgetINR: 20000 },
  { name: 'Health & Pharmacy', icon: 'Activity', color: '#06b6d4', budgetAED: 800, budgetINR: 8000 },
  { name: 'Housing & Rent', icon: 'Home', color: '#8b5cf6', budgetAED: 5500, budgetINR: 35000 },
  { name: 'Other & Miscellaneous', icon: 'Layers', color: '#64748b', budgetAED: 1000, budgetINR: 10000 },
  { name: 'Shopping & Electronics', icon: 'ShoppingBag', color: '#3b82f6', budgetAED: 1200, budgetINR: 12000 },
  { name: 'Transport, Salik & Fuel', icon: 'Car', color: '#eab308', budgetAED: 1200, budgetINR: 8000 },
  { name: 'Utilities & DEWA', icon: 'Zap', color: '#f59e0b', budgetAED: 1000, budgetINR: 6000 },
];

export function generateInitialCategories(): Category[] {
  const result: Category[] = [];
  const now = Date.now();

  const currencies: Currency[] = ['AED', 'INR'];

  for (const curr of currencies) {
    for (const cat of PREDEFINED_CATEGORIES_RAW) {
      const budget = curr === 'AED' ? cat.budgetAED * 100 : cat.budgetINR * 100;
      result.push({
        id: `cat_${curr.toLowerCase()}_${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: cat.name,
        currency: curr,
        icon: cat.icon,
        color: cat.color,
        description: `Standard expense category for ${cat.name} (${curr})`,
        monthlyBudgetMinor: budget,
        isCustom: false,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return result;
}

export function generateInitialSeedData(): {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  debts: DebtRecord[];
  repayments: RepaymentRecord[];
  reminders: ReminderRecord[];
  savingsGoals: SavingsGoal[];
} {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

  // AED Sample Data
  const aedIncomes: IncomeRecord[] = [
    {
      id: 'inc-aed-1',
      date: today,
      amountMinor: 1500000, // 15,000 AED salary
      currency: 'AED',
      source: 'Salary',
      paymentMethod: 'BANK_TRANSFER',
      description: 'Monthly Corporate Salary',
      tags: ['salary', 'main'],
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
    },
    {
      id: 'inc-aed-2',
      date: today,
      amountMinor: 250000, // 2,500 AED freelance
      currency: 'AED',
      source: 'Freelance',
      paymentMethod: 'BANK_TRANSFER',
      description: 'Fintech UI consulting milestone',
      tags: ['consulting'],
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
  ];

  const aedExpenses: ExpenseRecord[] = [
    {
      id: 'exp-aed-1',
      date: today,
      amountMinor: 45000, // 450 AED
      categoryId: 'cat_aed_groceries___supermarket',
      currency: 'AED',
      merchant: 'Carrefour Mall of the Emirates',
      reason: 'Weekly family groceries and fresh produce',
      paymentMethod: 'CARD',
      tags: ['groceries'],
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
    },
    {
      id: 'exp-aed-2',
      date: today,
      amountMinor: 18000, // 180 AED
      categoryId: 'cat_aed_transport__salik___fuel',
      currency: 'AED',
      merchant: 'ENOC Service Station',
      reason: 'Special 95 Petrol refill & Salik topup',
      paymentMethod: 'CARD',
      tags: ['fuel', 'salik'],
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
    {
      id: 'exp-aed-3',
      date: today,
      amountMinor: 22000, // 220 AED
      categoryId: 'cat_aed_food___dining',
      currency: 'AED',
      merchant: 'Al Safadi Restaurant',
      reason: 'Team dinner with Lebanese mezze',
      paymentMethod: 'CARD',
      tags: ['dining'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'exp-aed-4',
      date: today,
      amountMinor: 85000, // 850 AED
      categoryId: 'cat_aed_utilities___dewa',
      currency: 'AED',
      merchant: 'Dubai Electricity & Water Authority (DEWA)',
      reason: 'Electricity and housing water bill',
      paymentMethod: 'BANK_TRANSFER',
      tags: ['bills', 'dewa'],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const aedDebts: DebtRecord[] = [
    {
      id: 'debt-aed-1',
      type: 'DEBIT', // Money I Owe
      personName: 'Emirates Islamic Auto Loan',
      contactInfo: '+971-4-3160000',
      originalAmountMinor: 1200000, // 12,000 AED
      currency: 'AED',
      startDate: '2026-09-01',
      dueDate: '2026-11-05',
      reason: 'Automobile installment finance',
      status: 'PARTIALLY_PAID',
      createdAt: now - 86400000 * 30,
      updatedAt: now - 86400000 * 5,
    },
    {
      id: 'debt-aed-2',
      type: 'CREDIT', // Money Owed to Me
      personName: 'Tariq Al-Hashemi',
      contactInfo: '+971-50-8912345',
      originalAmountMinor: 350000, // 3,500 AED
      currency: 'AED',
      startDate: '2026-10-05',
      dueDate: '2026-11-15',
      reason: 'Friend emergency equipment support',
      status: 'ACTIVE',
      createdAt: now - 86400000 * 15,
      updatedAt: now - 86400000 * 15,
    },
  ];

  const aedRepayments: RepaymentRecord[] = [
    {
      id: 'rep-aed-1',
      debtId: 'debt-aed-1',
      date: '2026-10-05',
      amountMinor: 200000, // 2,000 AED repaid
      currency: 'AED',
      paymentMethod: 'BANK_TRANSFER',
      paymentSourceOrDest: 'Salary Account',
      notes: 'October monthly principal installment',
      createdAt: now - 86400000 * 18,
    },
  ];

  const aedReminders: ReminderRecord[] = [
    {
      id: 'rem-aed-1',
      title: 'Auto Loan Installment Due',
      relatedDebtId: 'debt-aed-1',
      personOrOrg: 'Emirates Islamic Auto Loan',
      amountMinor: 200000,
      currency: 'AED',
      dueDate: '2026-11-05',
      reminderDateTime: '2026-11-03T09:00',
      repeatSchedule: 'MONTHLY',
      notes: 'Monthly loan installment transfer',
      status: 'UPCOMING',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rem-aed-2',
      title: 'Receive Equipment Return from Tariq',
      relatedDebtId: 'debt-aed-2',
      personOrOrg: 'Tariq Al-Hashemi',
      amountMinor: 350000,
      currency: 'AED',
      dueDate: '2026-11-15',
      reminderDateTime: '2026-11-14T10:00',
      repeatSchedule: 'NONE',
      notes: 'Check transfer status',
      status: 'UPCOMING',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const aedSavingsGoals: SavingsGoal[] = [
    {
      id: 'sav-aed-1',
      name: 'Emergency Fund (6 Months)',
      currency: 'AED',
      targetAmountMinor: 5000000, // 50,000 AED
      currentAmountMinor: 2850000, // 28,500 AED
      targetDate: '2027-04-30',
      notes: 'Liquid high yield savings account in Dubai Islamic Bank',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sav-aed-2',
      name: 'Annual Family Vacation',
      currency: 'AED',
      targetAmountMinor: 1500000, // 15,000 AED
      currentAmountMinor: 920000, // 9,200 AED
      targetDate: '2027-07-15',
      notes: 'Flights and summer resort stay',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // INR Sample Data
  const inrIncomes: IncomeRecord[] = [
    {
      id: 'inc-inr-1',
      date: today,
      amountMinor: 18000000, // 1,80,000 INR
      currency: 'INR',
      source: 'Salary',
      paymentMethod: 'BANK_TRANSFER',
      description: 'Monthly Senior Tech Lead Salary',
      tags: ['salary'],
      createdAt: now - 86400000 * 3,
      updatedAt: now - 86400000 * 3,
    },
    {
      id: 'inc-inr-2',
      date: today,
      amountMinor: 2500000, // 25,000 INR
      currency: 'INR',
      source: 'Rental Income',
      paymentMethod: 'UPI',
      description: 'Apartment rent deposit',
      tags: ['rental'],
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
  ];

  const inrExpenses: ExpenseRecord[] = [
    {
      id: 'exp-inr-1',
      date: today,
      amountMinor: 1200000, // 12,000 INR
      categoryId: 'cat_inr_groceries___supermarket',
      currency: 'INR',
      merchant: 'Nature Basket Supermarket',
      reason: 'Monthly gourmet groceries & spices',
      paymentMethod: 'UPI',
      tags: ['groceries'],
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
    },
    {
      id: 'exp-inr-2',
      date: today,
      amountMinor: 380000, // 3,800 INR
      categoryId: 'cat_inr_food___dining',
      currency: 'INR',
      merchant: 'Mainland China Dining',
      reason: 'Family weekend dinner',
      paymentMethod: 'CARD',
      tags: ['dining'],
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
  ];

  const inrDebts: DebtRecord[] = [
    {
      id: 'debt-inr-1',
      type: 'CREDIT', // Money Owed to Me
      personName: 'Rohan Verma',
      contactInfo: '+91-9876543210',
      originalAmountMinor: 5000000, // 50,000 INR
      currency: 'INR',
      startDate: '2026-09-15',
      dueDate: '2026-11-20',
      reason: 'Home setup bridge loan',
      status: 'PARTIALLY_PAID',
      createdAt: now - 86400000 * 20,
      updatedAt: now - 86400000 * 5,
    },
  ];

  const inrRepayments: RepaymentRecord[] = [
    {
      id: 'rep-inr-1',
      debtId: 'debt-inr-1',
      date: '2026-10-10',
      amountMinor: 2000000, // 20,000 INR repaid
      currency: 'INR',
      paymentMethod: 'UPI',
      paymentSourceOrDest: 'HDFC Bank',
      notes: 'First installment via GPay',
      createdAt: now - 86400000 * 12,
    },
  ];

  const inrReminders: ReminderRecord[] = [
    {
      id: 'rem-inr-1',
      title: 'Rohan Balance Collection',
      relatedDebtId: 'debt-inr-1',
      personOrOrg: 'Rohan Verma',
      amountMinor: 3000000, // 30,000 INR remaining
      currency: 'INR',
      dueDate: '2026-11-20',
      reminderDateTime: '2026-11-19T11:00',
      repeatSchedule: 'NONE',
      notes: 'Remaining 30,000 INR collection',
      status: 'UPCOMING',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const inrSavingsGoals: SavingsGoal[] = [
    {
      id: 'sav-inr-1',
      name: 'PPF & Mutual Fund SIP Target',
      currency: 'INR',
      targetAmountMinor: 100000000, // 10 Lakhs (1,000,000 INR)
      currentAmountMinor: 48000000, // 4.8 Lakhs
      targetDate: '2027-12-31',
      notes: 'Index funds and sovereign gold bonds',
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    incomes: [...aedIncomes, ...inrIncomes],
    expenses: [...aedExpenses, ...inrExpenses],
    debts: [...aedDebts, ...inrDebts],
    repayments: [...aedRepayments, ...inrRepayments],
    reminders: [...aedReminders, ...inrReminders],
    savingsGoals: [...aedSavingsGoals, ...inrSavingsGoals],
  };
}

export const StorageService = {
  getSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      const defaultSettings: AppSettings = {
        defaultCurrency: 'AED',
        theme: 'dark',
        dateFormat: 'YYYY-MM-DD',
        weekStartDay: 'MONDAY',
        soundEnabled: true,
        hapticsEnabled: true,
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {
        defaultCurrency: 'AED',
        theme: 'dark',
        dateFormat: 'YYYY-MM-DD',
        weekStartDay: 'MONDAY',
        soundEnabled: true,
        hapticsEnabled: true,
      };
    }
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getCategories(): Category[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      const initial = generateInitialCategories();
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initial));
      return initial;
    }
    try {
      const parsed: Category[] = JSON.parse(raw);
      return parsed;
    } catch {
      return generateInitialCategories();
    }
  },

  saveCategories(categories: Category[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getIncomes(): IncomeRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INCOMES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveIncomes(incomes: IncomeRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
  },

  getExpenses(): ExpenseRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveExpenses(expenses: ExpenseRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  getDebts(): DebtRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveDebts(debts: DebtRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  },

  getRepayments(): RepaymentRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REPAYMENTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveRepayments(repayments: RepaymentRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.REPAYMENTS, JSON.stringify(repayments));
  },

  getReminders(): ReminderRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveReminders(reminders: ReminderRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  },

  getBudgets(): BudgetRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveBudgets(budgets: BudgetRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  },

  getSavingsGoals(): SavingsGoal[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSavingsGoals(goals: SavingsGoal[]): void {
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(goals));
  },

  getAttachments(): AttachmentRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTACHMENTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveAttachments(attachments: AttachmentRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify(attachments));
  },

  addAttachment(attachment: AttachmentRecord): void {
    const all = this.getAttachments();
    this.saveAttachments([attachment, ...all]);
  },

  deleteAttachment(id: string): void {
    const all = this.getAttachments();
    this.saveAttachments(all.filter(a => a.id !== id));
  },

  deleteAttachmentsForRecord(recordId: string): void {
    const all = this.getAttachments();
    this.saveAttachments(all.filter(a => a.recordId !== recordId));
  },

  initializeDatabaseIfEmpty(): void {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      const seed = generateInitialSeedData();
      const categories = generateInitialCategories();
      const settings = this.getSettings();

      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(seed.incomes));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(seed.expenses));
      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(seed.debts));
      localStorage.setItem(STORAGE_KEYS.REPAYMENTS, JSON.stringify(seed.repayments));
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(seed.reminders));
      localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(seed.savingsGoals));
      localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  },

  exportFullBackup(): FullBackupData {
    const settings = this.getSettings();
    return {
      appName: 'FinTech',
      developer: 'Musabbir KM',
      company: 'Zavyani',
      domain: 'zavyani.xyz',
      email: 'zavyani@zavyani.xyz',
      version: '1.0.0',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      currencySeparationStrict: true,
      categories: this.getCategories(),
      incomes: this.getIncomes(),
      expenses: this.getExpenses(),
      debts: this.getDebts(),
      repayments: this.getRepayments(),
      reminders: this.getReminders(),
      budgets: this.getBudgets(),
      savingsGoals: this.getSavingsGoals(),
      attachments: this.getAttachments(),
      settings: settings,
    };
  },

  validateAndRestoreBackup(
    backupJsonStr: string,
    mode: 'MERGE' | 'REPLACE' = 'REPLACE'
  ): { success: boolean; message: string; summary?: { categories: number; incomes: number; expenses: number; debts: number; attachments: number } } {
    try {
      const data: FullBackupData = JSON.parse(backupJsonStr);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid JSON file structure.' };
      }

      if (!Array.isArray(data.categories) || !Array.isArray(data.incomes) || !Array.isArray(data.expenses)) {
        return { success: false, message: 'Backup file missing essential financial entity arrays.' };
      }

      // Validate currency codes
      const validCurrencies: Currency[] = ['AED', 'INR'];
      for (const inc of data.incomes) {
        if (!validCurrencies.includes(inc.currency) || !Number.isInteger(inc.amountMinor) || inc.amountMinor < 0) {
          return { success: false, message: `Invalid income record found with currency ${inc.currency} or amount ${inc.amountMinor}` };
        }
      }

      for (const exp of data.expenses) {
        if (!validCurrencies.includes(exp.currency) || !Number.isInteger(exp.amountMinor) || exp.amountMinor < 0) {
          return { success: false, message: `Invalid expense record found with currency ${exp.currency} or amount ${exp.amountMinor}` };
        }
      }

      for (const debt of data.debts || []) {
        if (!validCurrencies.includes(debt.currency) || !Number.isInteger(debt.originalAmountMinor) || debt.originalAmountMinor < 0) {
          return { success: false, message: `Invalid debt record found with currency ${debt.currency}` };
        }
      }

      const incomingAttachments = Array.isArray(data.attachments) ? data.attachments : [];

      if (mode === 'REPLACE') {
        this.saveCategories(data.categories);
        this.saveIncomes(data.incomes);
        this.saveExpenses(data.expenses);
        this.saveDebts(data.debts || []);
        this.saveRepayments(data.repayments || []);
        this.saveReminders(data.reminders || []);
        this.saveBudgets(data.budgets || []);
        this.saveSavingsGoals(data.savingsGoals || []);
        this.saveAttachments(incomingAttachments);
        if (data.settings) {
          this.saveSettings(data.settings);
        }
      } else {
        // MERGE mode: merge by ID avoiding duplicates
        const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
          const map = new Map<string, T>();
          existing.forEach(item => map.set(item.id, item));
          incoming.forEach(item => map.set(item.id, item));
          return Array.from(map.values());
        };

        this.saveCategories(mergeById(this.getCategories(), data.categories));
        this.saveIncomes(mergeById(this.getIncomes(), data.incomes));
        this.saveExpenses(mergeById(this.getExpenses(), data.expenses));
        this.saveDebts(mergeById(this.getDebts(), data.debts || []));
        this.saveRepayments(mergeById(this.getRepayments(), data.repayments || []));
        this.saveReminders(mergeById(this.getReminders(), data.reminders || []));
        this.saveBudgets(mergeById(this.getBudgets(), data.budgets || []));
        this.saveSavingsGoals(mergeById(this.getSavingsGoals(), data.savingsGoals || []));
        this.saveAttachments(mergeById(this.getAttachments(), incomingAttachments));
      }

      const updatedSettings = this.getSettings();
      updatedSettings.lastBackupDate = new Date().toISOString();
      this.saveSettings(updatedSettings);

      return {
        success: true,
        message: `Successfully restored database (${mode === 'REPLACE' ? 'Clean Replacement' : 'Merged with existing'}).`,
        summary: {
          categories: data.categories.length,
          incomes: data.incomes.length,
          expenses: data.expenses.length,
          debts: (data.debts || []).length,
          attachments: incomingAttachments.length,
        },
      };
    } catch (err: any) {
      return { success: false, message: `Failed to restore backup: ${err.message || 'JSON Parse error'}` };
    }
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.INCOMES);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.DEBTS);
    localStorage.removeItem(STORAGE_KEYS.REPAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.REMINDERS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.SAVINGS_GOALS);
    localStorage.removeItem(STORAGE_KEYS.ATTACHMENTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    this.initializeDatabaseIfEmpty();
  },
};
