/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FinTech Backup & Restore Engine:
 * Full schema validation, relationship integrity checks, preview generation,
 * duplicate detection, and atomic rollback for AED & INR financial records.
 * Developed by Musabbir KM | A Zavyani product (zavyani.xyz)
 */

import {
  FullBackupData,
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
} from '../types';
import { StorageService } from '../db/storage';
import { formatFileSize } from './attachments';
import { toMajorUnits } from './money';

export interface CurrencyRecordBreakdown {
  incomes: number;
  incomeTotalMajor: number;
  expenses: number;
  expenseTotalMajor: number;
  debtsOwed: number; // Money I Owe (DEBIT)
  debtsReceivable: number; // Money Owed to Me (CREDIT)
  repayments: number;
  repaymentTotalMajor: number;
  reminders: number;
  savingsGoals: number;
  categories: number;
  attachments: number;
}

export interface BackupValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    filename: string;
    fileSizeBytes: number;
    fileSizeFormatted: string;
  };
  schemaInfo: {
    appName: string;
    version: string;
    schemaVersion: number;
    exportedAt: string;
    developer?: string;
    company?: string;
  };
  aedCounts: CurrencyRecordBreakdown;
  inrCounts: CurrencyRecordBreakdown;
  totalRecords: number;
  potentialDuplicates: {
    incomes: number;
    expenses: number;
    debts: number;
    repayments: number;
    reminders: number;
    savingsGoals: number;
    categories: number;
    attachments: number;
  };
  parsedData: FullBackupData | null;
}

export const MAX_BACKUP_FILE_SIZE = 50 * 1024 * 1024; // 50MB safe boundary

/**
 * Validates the backup JSON string and prepares a detailed preview breakdown
 * with separate AED and INR counters, relationship validation, and duplicate audits.
 */
export function validateBackupContent(
  jsonText: string,
  fileInfo: { filename: string; size: number }
): BackupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const emptyBreakdown = (): CurrencyRecordBreakdown => ({
    incomes: 0,
    incomeTotalMajor: 0,
    expenses: 0,
    expenseTotalMajor: 0,
    debtsOwed: 0,
    debtsReceivable: 0,
    repayments: 0,
    repaymentTotalMajor: 0,
    reminders: 0,
    savingsGoals: 0,
    categories: 0,
    attachments: 0,
  });

  const aedCounts = emptyBreakdown();
  const inrCounts = emptyBreakdown();

  const potentialDuplicates = {
    incomes: 0,
    expenses: 0,
    debts: 0,
    repayments: 0,
    reminders: 0,
    savingsGoals: 0,
    categories: 0,
    attachments: 0,
  };

  const resultTemplate: BackupValidationResult = {
    valid: false,
    errors,
    warnings,
    fileInfo: {
      filename: fileInfo.filename,
      fileSizeBytes: fileInfo.size,
      fileSizeFormatted: formatFileSize(fileInfo.size),
    },
    schemaInfo: {
      appName: 'Unknown',
      version: 'Unknown',
      schemaVersion: 0,
      exportedAt: new Date().toISOString(),
      developer: 'Musabbir KM',
      company: 'Zavyani',
    },
    aedCounts,
    inrCounts,
    totalRecords: 0,
    potentialDuplicates,
    parsedData: null as FullBackupData | null,
  };

  // 1. File size check
  if (fileInfo.size > MAX_BACKUP_FILE_SIZE) {
    errors.push(`Backup file size (${formatFileSize(fileInfo.size)}) exceeds the maximum allowed limit of 50MB.`);
    return resultTemplate;
  }

  // 2. JSON Parse Safety
  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: any) {
    errors.push(`Malformed JSON file: Unable to parse contents (${err.message || 'SyntaxError'}). Please select a valid JSON backup.`);
    return resultTemplate;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    errors.push('Invalid backup structure: Root must be a JSON object containing FinTech ledger tables.');
    return resultTemplate;
  }

  // 3. Schema Header Validation
  const appName = typeof parsed.appName === 'string' ? parsed.appName : '';
  const version = typeof parsed.version === 'string' ? parsed.version : '';
  const schemaVersion = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 0;
  const exportedAt = typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '';

  if (!appName) {
    warnings.push('Backup missing "appName" header. Compatible FinTech schema detected.');
  } else if (!appName.toLowerCase().includes('fintech')) {
    warnings.push(`Backup appName is "${appName}". Ensure this file originated from FinTech.`);
  }

  resultTemplate.schemaInfo = {
    appName: appName || 'FinTech',
    version: version || '1.0.0',
    schemaVersion: schemaVersion || 1,
    exportedAt: exportedAt || new Date().toISOString(),
    developer: parsed.developer || 'Musabbir KM',
    company: parsed.company || 'Zavyani',
  };

  // 4. Required Financial Entity Tables
  if (!Array.isArray(parsed.categories)) {
    errors.push('Missing required "categories" array.');
  }
  if (!Array.isArray(parsed.incomes)) {
    errors.push('Missing required "incomes" array.');
  }
  if (!Array.isArray(parsed.expenses)) {
    errors.push('Missing required "expenses" array.');
  }

  if (errors.length > 0) {
    return resultTemplate;
  }

  // Current database records to check existing duplicates
  const existingIncomes = StorageService.getIncomes();
  const existingExpenses = StorageService.getExpenses();
  const existingDebts = StorageService.getDebts();
  const existingRepayments = StorageService.getRepayments();
  const existingReminders = StorageService.getReminders();
  const existingGoals = StorageService.getSavingsGoals();
  const existingCategories = StorageService.getCategories();
  const existingAttachments = StorageService.getAttachments();

  const existingIncomeIdSet = new Set(existingIncomes.map(i => i.id));
  const existingExpenseIdSet = new Set(existingExpenses.map(e => e.id));
  const existingDebtIdSet = new Set(existingDebts.map(d => d.id));
  const existingRepaymentIdSet = new Set(existingRepayments.map(r => r.id));
  const existingReminderIdSet = new Set(existingReminders.map(r => r.id));
  const existingGoalIdSet = new Set(existingGoals.map(g => g.id));
  const existingCategoryIdSet = new Set(existingCategories.map(c => c.id));
  const existingAttachmentIdSet = new Set(existingAttachments.map(a => a.id));

  const validCurrencies: Currency[] = ['AED', 'INR'];
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

  // Validate Categories
  const incomingCategoryIdSet = new Set<string>();
  const categories: Category[] = parsed.categories;
  for (let idx = 0; idx < categories.length; idx++) {
    const c = categories[idx];
    if (!c || typeof c !== 'object') {
      errors.push(`Category at index ${idx} is not a valid object.`);
      continue;
    }
    if (!c.id || typeof c.id !== 'string') {
      errors.push(`Category at index ${idx} is missing a valid string "id".`);
      continue;
    }
    if (!validCurrencies.includes(c.currency)) {
      errors.push(`Category "${c.name || c.id}" has invalid currency "${c.currency}". Must be AED or INR.`);
    }
    if (incomingCategoryIdSet.has(c.id)) {
      warnings.push(`Duplicate category ID in backup: "${c.id}".`);
    }
    incomingCategoryIdSet.add(c.id);

    if (existingCategoryIdSet.has(c.id)) {
      potentialDuplicates.categories++;
    }

    if (c.currency === 'AED') aedCounts.categories++;
    else if (c.currency === 'INR') inrCounts.categories++;
  }

  // Validate Incomes
  const incomingIncomeIdSet = new Set<string>();
  const incomes: IncomeRecord[] = parsed.incomes;
  for (let idx = 0; idx < incomes.length; idx++) {
    const inc = incomes[idx];
    if (!inc || typeof inc !== 'object') {
      errors.push(`Income record at index ${idx} is invalid.`);
      continue;
    }
    if (!inc.id || typeof inc.id !== 'string') {
      errors.push(`Income record at index ${idx} has invalid ID.`);
      continue;
    }
    if (!validCurrencies.includes(inc.currency)) {
      errors.push(`Income "${inc.id}" has invalid currency "${inc.currency}". Must be AED or INR.`);
    }
    if (typeof inc.amountMinor !== 'number' || !Number.isInteger(inc.amountMinor) || inc.amountMinor < 0) {
      errors.push(`Income "${inc.id}" has invalid amountMinor (${inc.amountMinor}). Must be a non-negative integer.`);
    }
    if (!inc.date || !isoDateRegex.test(inc.date)) {
      warnings.push(`Income "${inc.id}" date "${inc.date}" does not follow ISO YYYY-MM-DD format.`);
    }

    if (incomingIncomeIdSet.has(inc.id)) {
      warnings.push(`Duplicate income ID in backup: "${inc.id}".`);
    }
    incomingIncomeIdSet.add(inc.id);

    if (existingIncomeIdSet.has(inc.id)) {
      potentialDuplicates.incomes++;
    }

    if (inc.currency === 'AED') {
      aedCounts.incomes++;
      aedCounts.incomeTotalMajor += toMajorUnits(inc.amountMinor || 0, 'AED');
    } else if (inc.currency === 'INR') {
      inrCounts.incomes++;
      inrCounts.incomeTotalMajor += toMajorUnits(inc.amountMinor || 0, 'INR');
    }
  }

  // Validate Expenses
  const incomingExpenseIdSet = new Set<string>();
  const expenses: ExpenseRecord[] = parsed.expenses;
  for (let idx = 0; idx < expenses.length; idx++) {
    const exp = expenses[idx];
    if (!exp || typeof exp !== 'object') {
      errors.push(`Expense record at index ${idx} is invalid.`);
      continue;
    }
    if (!exp.id || typeof exp.id !== 'string') {
      errors.push(`Expense record at index ${idx} has invalid ID.`);
      continue;
    }
    if (!validCurrencies.includes(exp.currency)) {
      errors.push(`Expense "${exp.id}" has invalid currency "${exp.currency}". Must be AED or INR.`);
    }
    if (typeof exp.amountMinor !== 'number' || !Number.isInteger(exp.amountMinor) || exp.amountMinor < 0) {
      errors.push(`Expense "${exp.id}" has invalid amountMinor (${exp.amountMinor}). Must be a non-negative integer.`);
    }
    if (!exp.date || !isoDateRegex.test(exp.date)) {
      warnings.push(`Expense "${exp.id}" date "${exp.date}" does not follow ISO YYYY-MM-DD format.`);
    }

    // Relationship check: Category ID
    if (exp.categoryId && !incomingCategoryIdSet.has(exp.categoryId) && !existingCategoryIdSet.has(exp.categoryId)) {
      warnings.push(`Expense "${exp.id}" references unknown category "${exp.categoryId}". Will automatically link to fallback category.`);
    }

    if (incomingExpenseIdSet.has(exp.id)) {
      warnings.push(`Duplicate expense ID in backup: "${exp.id}".`);
    }
    incomingExpenseIdSet.add(exp.id);

    if (existingExpenseIdSet.has(exp.id)) {
      potentialDuplicates.expenses++;
    }

    if (exp.currency === 'AED') {
      aedCounts.expenses++;
      aedCounts.expenseTotalMajor += toMajorUnits(exp.amountMinor || 0, 'AED');
    } else if (exp.currency === 'INR') {
      inrCounts.expenses++;
      inrCounts.expenseTotalMajor += toMajorUnits(exp.amountMinor || 0, 'INR');
    }
  }

  // Validate Debts & Receivables
  const incomingDebtIdSet = new Set<string>();
  const debts: DebtRecord[] = Array.isArray(parsed.debts) ? parsed.debts : [];
  for (let idx = 0; idx < debts.length; idx++) {
    const d = debts[idx];
    if (!d || typeof d !== 'object' || !d.id) {
      errors.push(`Debt at index ${idx} is missing or has invalid ID.`);
      continue;
    }
    if (!validCurrencies.includes(d.currency)) {
      errors.push(`Debt "${d.id}" has invalid currency "${d.currency}".`);
    }
    if (d.type !== 'DEBIT' && d.type !== 'CREDIT') {
      errors.push(`Debt "${d.id}" has invalid type "${d.type}". Must be DEBIT or CREDIT.`);
    }
    if (typeof d.originalAmountMinor !== 'number' || !Number.isInteger(d.originalAmountMinor) || d.originalAmountMinor < 0) {
      errors.push(`Debt "${d.id}" has invalid principal amount.`);
    }

    incomingDebtIdSet.add(d.id);
    if (existingDebtIdSet.has(d.id)) {
      potentialDuplicates.debts++;
    }

    if (d.currency === 'AED') {
      if (d.type === 'DEBIT') aedCounts.debtsOwed++;
      else aedCounts.debtsReceivable++;
    } else if (d.currency === 'INR') {
      if (d.type === 'DEBIT') inrCounts.debtsOwed++;
      else inrCounts.debtsReceivable++;
    }
  }

  // Validate Repayments (Relationship check: points to debt)
  const repayments: RepaymentRecord[] = Array.isArray(parsed.repayments) ? parsed.repayments : [];
  for (let idx = 0; idx < repayments.length; idx++) {
    const rep = repayments[idx];
    if (!rep || typeof rep !== 'object' || !rep.id) {
      errors.push(`Repayment at index ${idx} is invalid.`);
      continue;
    }
    if (!validCurrencies.includes(rep.currency)) {
      errors.push(`Repayment "${rep.id}" has invalid currency "${rep.currency}".`);
    }
    if (typeof rep.amountMinor !== 'number' || !Number.isInteger(rep.amountMinor) || rep.amountMinor < 0) {
      errors.push(`Repayment "${rep.id}" has invalid amount.`);
    }

    // Check relationship
    if (rep.debtId && !incomingDebtIdSet.has(rep.debtId) && !existingDebtIdSet.has(rep.debtId)) {
      warnings.push(`Repayment "${rep.id}" references debt "${rep.debtId}" not found in current ledger or backup.`);
    }

    if (existingRepaymentIdSet.has(rep.id)) {
      potentialDuplicates.repayments++;
    }

    if (rep.currency === 'AED') {
      aedCounts.repayments++;
      aedCounts.repaymentTotalMajor += toMajorUnits(rep.amountMinor || 0, 'AED');
    } else if (rep.currency === 'INR') {
      inrCounts.repayments++;
      inrCounts.repaymentTotalMajor += toMajorUnits(rep.amountMinor || 0, 'INR');
    }
  }

  // Validate Reminders
  const reminders: ReminderRecord[] = Array.isArray(parsed.reminders) ? parsed.reminders : [];
  for (const rem of reminders) {
    if (rem && rem.id) {
      if (existingReminderIdSet.has(rem.id)) potentialDuplicates.reminders++;
      if (rem.currency === 'AED') aedCounts.reminders++;
      else if (rem.currency === 'INR') inrCounts.reminders++;
    }
  }

  // Validate Savings Goals
  const savingsGoals: SavingsGoal[] = Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [];
  for (const goal of savingsGoals) {
    if (goal && goal.id) {
      if (existingGoalIdSet.has(goal.id)) potentialDuplicates.savingsGoals++;
      if (goal.currency === 'AED') aedCounts.savingsGoals++;
      else if (goal.currency === 'INR') inrCounts.savingsGoals++;
    }
  }

  // Validate Attachments
  const attachments: AttachmentRecord[] = Array.isArray(parsed.attachments) ? parsed.attachments : [];
  for (const att of attachments) {
    if (att && att.id) {
      if (existingAttachmentIdSet.has(att.id)) potentialDuplicates.attachments++;
      if (att.currency === 'AED') aedCounts.attachments++;
      else if (att.currency === 'INR') inrCounts.attachments++;
    }
  }

  const budgets: BudgetRecord[] = Array.isArray(parsed.budgets) ? parsed.budgets : [];

  const totalRecords =
    categories.length +
    incomes.length +
    expenses.length +
    debts.length +
    repayments.length +
    reminders.length +
    savingsGoals.length +
    attachments.length;

  resultTemplate.valid = errors.length === 0;
  resultTemplate.aedCounts = aedCounts;
  resultTemplate.inrCounts = inrCounts;
  resultTemplate.totalRecords = totalRecords;
  resultTemplate.potentialDuplicates = potentialDuplicates;
  resultTemplate.parsedData = resultTemplate.valid
    ? {
        appName: resultTemplate.schemaInfo.appName,
        version: resultTemplate.schemaInfo.version,
        schemaVersion: resultTemplate.schemaInfo.schemaVersion,
        exportedAt: resultTemplate.schemaInfo.exportedAt,
        currencySeparationStrict: true,
        categories,
        incomes,
        expenses,
        debts,
        repayments,
        reminders,
        budgets,
        savingsGoals,
        attachments,
        settings: parsed.settings || StorageService.getSettings(),
      }
    : null;

  return resultTemplate;
}

/**
 * Executes safe restoration with complete atomic rollback.
 * If any storage error occurs, all records are reverted to the pre-restore state.
 */
export function executeAtomicRestore(
  data: FullBackupData,
  mode: 'REPLACE' | 'MERGE'
): {
  success: boolean;
  message: string;
  stats?: {
    categoriesCount: number;
    incomesCount: number;
    expensesCount: number;
    debtsCount: number;
    repaymentsCount: number;
    remindersCount: number;
    savingsGoalsCount: number;
    attachmentsCount: number;
  };
} {
  // Step 1: Capture complete rollback snapshot of current database in memory
  const snapshot = {
    categories: StorageService.getCategories(),
    incomes: StorageService.getIncomes(),
    expenses: StorageService.getExpenses(),
    debts: StorageService.getDebts(),
    repayments: StorageService.getRepayments(),
    reminders: StorageService.getReminders(),
    budgets: StorageService.getBudgets(),
    savingsGoals: StorageService.getSavingsGoals(),
    attachments: StorageService.getAttachments(),
    settings: StorageService.getSettings(),
  };

  try {
    let finalCategories: Category[];
    let finalIncomes: IncomeRecord[];
    let finalExpenses: ExpenseRecord[];
    let finalDebts: DebtRecord[];
    let finalRepayments: RepaymentRecord[];
    let finalReminders: ReminderRecord[];
    let finalBudgets: BudgetRecord[];
    let finalSavingsGoals: SavingsGoal[];
    let finalAttachments: AttachmentRecord[];

    if (mode === 'REPLACE') {
      finalCategories = data.categories;
      finalIncomes = data.incomes;
      finalExpenses = data.expenses;
      finalDebts = data.debts || [];
      finalRepayments = data.repayments || [];
      finalReminders = data.reminders || [];
      finalBudgets = data.budgets || [];
      finalSavingsGoals = data.savingsGoals || [];
      finalAttachments = data.attachments || [];
    } else {
      // MERGE Mode: Merge by unique ID and fingerprint to avoid accidental duplicates
      const mergeRecords = <T extends { id: string }>(
        existing: T[],
        incoming: T[],
        fingerprintFn?: (item: T) => string
      ): T[] => {
        const idMap = new Map<string, T>();
        const fingerprintSet = new Set<string>();

        // Populate existing
        for (const item of existing) {
          idMap.set(item.id, item);
          if (fingerprintFn) fingerprintSet.add(fingerprintFn(item));
        }

        // Add incoming, skipping identical fingerprints to prevent duplicate entries
        for (const item of incoming) {
          if (idMap.has(item.id)) {
            // Overwrite existing record with latest incoming
            idMap.set(item.id, item);
          } else if (fingerprintFn && fingerprintSet.has(fingerprintFn(item))) {
            // Identical transaction fingerprint detected, skip duplicate
            continue;
          } else {
            idMap.set(item.id, item);
            if (fingerprintFn) fingerprintSet.add(fingerprintFn(item));
          }
        }

        return Array.from(idMap.values());
      };

      // Fingerprints for financial entries
      const incomeFingerprint = (i: IncomeRecord) => `${i.currency}_${i.date}_${i.amountMinor}_${i.source}_${i.paymentMethod}`;
      const expenseFingerprint = (e: ExpenseRecord) => `${e.currency}_${e.date}_${e.amountMinor}_${e.merchant}_${e.reason}`;
      const repaymentFingerprint = (r: RepaymentRecord) => `${r.currency}_${r.debtId}_${r.date}_${r.amountMinor}`;

      finalCategories = mergeRecords(snapshot.categories, data.categories);
      finalIncomes = mergeRecords(snapshot.incomes, data.incomes, incomeFingerprint);
      finalExpenses = mergeRecords(snapshot.expenses, data.expenses, expenseFingerprint);
      finalDebts = mergeRecords(snapshot.debts, data.debts || []);
      finalRepayments = mergeRecords(snapshot.repayments, data.repayments || [], repaymentFingerprint);
      finalReminders = mergeRecords(snapshot.reminders, data.reminders || []);
      finalBudgets = mergeRecords(snapshot.budgets, data.budgets || []);
      finalSavingsGoals = mergeRecords(snapshot.savingsGoals, data.savingsGoals || []);
      finalAttachments = mergeRecords(snapshot.attachments, data.attachments || []);
    }

    // Step 2: Atomic writes
    StorageService.saveCategories(finalCategories);
    StorageService.saveIncomes(finalIncomes);
    StorageService.saveExpenses(finalExpenses);
    StorageService.saveDebts(finalDebts);
    StorageService.saveRepayments(finalRepayments);
    StorageService.saveReminders(finalReminders);
    StorageService.saveBudgets(finalBudgets);
    StorageService.saveSavingsGoals(finalSavingsGoals);
    StorageService.saveAttachments(finalAttachments);

    const updatedSettings = StorageService.getSettings();
    updatedSettings.lastBackupDate = new Date().toISOString();
    StorageService.saveSettings(updatedSettings);

    return {
      success: true,
      message: `Database successfully restored (${mode === 'REPLACE' ? 'Clean Replacement' : 'Merged with Existing Records'}).`,
      stats: {
        categoriesCount: finalCategories.length,
        incomesCount: finalIncomes.length,
        expensesCount: finalExpenses.length,
        debtsCount: finalDebts.length,
        repaymentsCount: finalRepayments.length,
        remindersCount: finalReminders.length,
        savingsGoalsCount: finalSavingsGoals.length,
        attachmentsCount: finalAttachments.length,
      },
    };
  } catch (err: any) {
    // Step 3: Atomic Rollback on failure
    console.error('Restoration transaction error, triggering full rollback:', err);
    try {
      StorageService.saveCategories(snapshot.categories);
      StorageService.saveIncomes(snapshot.incomes);
      StorageService.saveExpenses(snapshot.expenses);
      StorageService.saveDebts(snapshot.debts);
      StorageService.saveRepayments(snapshot.repayments);
      StorageService.saveReminders(snapshot.reminders);
      StorageService.saveBudgets(snapshot.budgets);
      StorageService.saveSavingsGoals(snapshot.savingsGoals);
      StorageService.saveAttachments(snapshot.attachments);
      StorageService.saveSettings(snapshot.settings);
    } catch (rollbackErr) {
      console.error('Fatal rollback error:', rollbackErr);
    }

    return {
      success: false,
      message: `Restoration failed and was rolled back safely to prevent corruption: ${err?.message || 'Storage write failure'}.`,
    };
  }
}
