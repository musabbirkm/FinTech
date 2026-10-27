/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Official Application Name: FinTech
 * Product Description: FinTech — Dirham & Rupee Smart Expense Tracker
 * Developer: Musabbir KM
 */

export type Currency = 'AED' | 'INR';

export type TimePeriod = 
  | 'TODAY'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'LAST_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_YEAR'
  | 'CUSTOM'
  | 'ALL_TIME';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'DEBT_BORROW' | 'DEBT_REPAY' | 'CREDIT_LEND' | 'CREDIT_COLLECT';

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER';

export type IncomeSource = 
  | 'Salary'
  | 'Freelance'
  | 'Business'
  | 'Rental Income'
  | 'Investment / Dividends'
  | 'Gifts'
  | 'Refunds'
  | 'Other';

export interface Category {
  id: string;
  name: string;
  currency: Currency;
  icon: string;
  color: string;
  description?: string;
  monthlyBudgetMinor?: number; // In minor units (fils/paise)
  isCustom: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface IncomeRecord {
  id: string;
  date: string; // ISO YYYY-MM-DD
  amountMinor: number; // Integer minor units (fils/paise)
  currency: Currency;
  source: string;
  paymentMethod: PaymentMethod;
  description?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ExpenseRecord {
  id: string;
  date: string; // ISO YYYY-MM-DD
  amountMinor: number; // Integer minor units (fils/paise)
  categoryId: string;
  currency: Currency;
  merchant: string;
  reason: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export type DebtType = 'DEBIT' | 'CREDIT'; // DEBIT = Money I Owe, CREDIT = Money Owed to Me
export type DebtStatus = 'ACTIVE' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'OVERDUE' | 'ARCHIVED';

export interface DebtRecord {
  id: string;
  type: DebtType;
  personName: string;
  contactInfo?: string;
  originalAmountMinor: number;
  currency: Currency;
  startDate: string; // ISO YYYY-MM-DD
  dueDate?: string; // ISO YYYY-MM-DD
  reason: string;
  notes?: string;
  status: DebtStatus;
  createdAt: number;
  updatedAt: number;
}

export interface RepaymentRecord {
  id: string;
  debtId: string;
  date: string; // ISO YYYY-MM-DD
  amountMinor: number; // Integer minor units
  currency: Currency;
  paymentMethod: PaymentMethod;
  paymentSourceOrDest?: string;
  notes?: string;
  createdAt: number;
}

export type ReminderStatus = 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'COMPLETED' | 'SNOOZED';
export type ReminderRepeat = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ReminderRecord {
  id: string;
  title: string;
  relatedDebtId?: string;
  personOrOrg: string;
  amountMinor?: number;
  currency: Currency;
  dueDate: string; // ISO YYYY-MM-DD
  reminderDateTime: string; // ISO format or YYYY-MM-DDTHH:mm
  repeatSchedule: ReminderRepeat;
  notes?: string;
  status: ReminderStatus;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetRecord {
  id: string;
  currency: Currency;
  month: string; // YYYY-MM
  overallBudgetMinor?: number;
  categoryBudgetsMinor?: Record<string, number>; // categoryId -> minor units
  updatedAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  currency: Currency;
  targetAmountMinor: number;
  currentAmountMinor: number;
  targetDate: string; // ISO YYYY-MM-DD
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type AttachmentRecordType = 'EXPENSE' | 'INCOME' | 'DEBT' | 'REPAYMENT' | 'CATEGORY';

export interface AttachmentRecord {
  id: string;
  recordId: string;
  recordType: AttachmentRecordType;
  categoryId?: string;
  currency: Currency;
  originalFilename: string;
  mimeType: string;
  fileSize: number; // in bytes
  dataUrl: string; // Base64 or Object URL data string
  createdAt: number;
}

export interface AppSettings {
  defaultCurrency: Currency;
  theme: 'dark' | 'light' | 'system';
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  weekStartDay: 'SUNDAY' | 'MONDAY';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  lastBackupDate?: string;
}

export interface FullBackupData {
  appName: string;
  developer?: string;
  company?: string;
  domain?: string;
  email?: string;
  version: string;
  schemaVersion: number;
  exportedAt: string;
  currencySeparationStrict: boolean;
  categories: Category[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  debts: DebtRecord[];
  repayments: RepaymentRecord[];
  reminders: ReminderRecord[];
  budgets: BudgetRecord[];
  savingsGoals: SavingsGoal[];
  attachments?: AttachmentRecord[];
  settings: AppSettings;
}
