import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  validateBackupContent,
  executeAtomicRestore,
  MAX_BACKUP_FILE_SIZE,
} from './backupRestore';
import { StorageService } from '../db/storage';
import { FullBackupData } from '../types';

// Mock localStorage for Node test environment if not present
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] || null,
    length: 0,
  } as any;
}

describe('FinTech Backup & Restore Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.initializeDatabaseIfEmpty();
  });

  const validBackupSample: FullBackupData = {
    appName: 'FinTech',
    developer: 'Musabbir KM',
    company: 'Zavyani',
    domain: 'zavyani.xyz',
    email: 'zavyani@zavyani.xyz',
    version: '1.0.0',
    schemaVersion: 1,
    exportedAt: '2026-10-25T10:00:00.000Z',
    currencySeparationStrict: true,
    categories: [
      {
        id: 'cat_aed_groceries',
        name: 'Groceries & Supermarket',
        currency: 'AED',
        icon: 'ShoppingCart',
        color: '#10b981',
        isCustom: false,
        isArchived: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'cat_inr_groceries',
        name: 'Groceries & Supermarket',
        currency: 'INR',
        icon: 'ShoppingCart',
        color: '#10b981',
        isCustom: false,
        isArchived: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ],
    incomes: [
      {
        id: 'inc_aed_1',
        date: '2026-10-01',
        amountMinor: 1000000, // 10,000 AED
        currency: 'AED',
        source: 'Corporate Salary',
        paymentMethod: 'BANK_TRANSFER',
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'inc_inr_1',
        date: '2026-10-01',
        amountMinor: 8000000, // 80,000 INR
        currency: 'INR',
        source: 'Consulting',
        paymentMethod: 'BANK_TRANSFER',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ],
    expenses: [
      {
        id: 'exp_aed_1',
        date: '2026-10-05',
        amountMinor: 35000, // 350 AED
        categoryId: 'cat_aed_groceries',
        currency: 'AED',
        merchant: 'Carrefour UAE',
        reason: 'Weekly groceries',
        paymentMethod: 'CARD',
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'exp_inr_1',
        date: '2026-10-06',
        amountMinor: 250000, // 2,500 INR
        categoryId: 'cat_inr_groceries',
        currency: 'INR',
        merchant: 'Reliance Smart',
        reason: 'Household items',
        paymentMethod: 'UPI',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ],
    debts: [
      {
        id: 'debt_aed_1',
        type: 'DEBIT',
        personName: 'Dubai Bank',
        originalAmountMinor: 500000, // 5,000 AED
        currency: 'AED',
        startDate: '2026-09-01',
        reason: 'Auto loan',
        status: 'ACTIVE',
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'debt_inr_1',
        type: 'CREDIT',
        personName: 'Ramesh Sharma',
        originalAmountMinor: 1500000, // 15,000 INR
        currency: 'INR',
        startDate: '2026-09-10',
        reason: 'Personal advance',
        status: 'ACTIVE',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ],
    repayments: [
      {
        id: 'rep_aed_1',
        debtId: 'debt_aed_1',
        date: '2026-10-10',
        amountMinor: 100000, // 1,000 AED
        currency: 'AED',
        paymentMethod: 'BANK_TRANSFER',
        createdAt: 1000,
      },
    ],
    reminders: [
      {
        id: 'rem_1',
        title: 'Credit Card Bill Due',
        personOrOrg: 'ENBD',
        currency: 'AED',
        dueDate: '2026-10-30',
        reminderDateTime: '2026-10-30T09:00',
        repeatSchedule: 'MONTHLY',
        status: 'UPCOMING',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ],
    budgets: [],
    savingsGoals: [
      {
        id: 'goal_1',
        name: 'Emergency Fund AED',
        currency: 'AED',
        targetAmountMinor: 3000000,
        currentAmountMinor: 1500000,
        targetDate: '2026-12-31',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ],
    attachments: [],
    settings: {
      defaultCurrency: 'AED',
      theme: 'dark',
      dateFormat: 'YYYY-MM-DD',
      weekStartDay: 'MONDAY',
      soundEnabled: true,
      hapticsEnabled: true,
    },
  };

  it('validates a complete backup and produces exact isolated AED and INR counters', () => {
    const jsonStr = JSON.stringify(validBackupSample);
    const result = validateBackupContent(jsonStr, {
      filename: 'FinTech_Complete_Backup.json',
      size: jsonStr.length,
    });

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);

    // AED Breakdown check
    assert.strictEqual(result.aedCounts.incomes, 1);
    assert.strictEqual(result.aedCounts.incomeTotalMajor, 10000);
    assert.strictEqual(result.aedCounts.expenses, 1);
    assert.strictEqual(result.aedCounts.expenseTotalMajor, 350);
    assert.strictEqual(result.aedCounts.debtsOwed, 1);
    assert.strictEqual(result.aedCounts.repayments, 1);
    assert.strictEqual(result.aedCounts.reminders, 1);
    assert.strictEqual(result.aedCounts.savingsGoals, 1);

    // INR Breakdown check (strictly separated, not combined)
    assert.strictEqual(result.inrCounts.incomes, 1);
    assert.strictEqual(result.inrCounts.incomeTotalMajor, 80000);
    assert.strictEqual(result.inrCounts.expenses, 1);
    assert.strictEqual(result.inrCounts.expenseTotalMajor, 2500);
    assert.strictEqual(result.inrCounts.debtsReceivable, 1);
    assert.strictEqual(result.inrCounts.repayments, 0);
  });

  it('rejects corrupted JSON syntax safely without touching the database', () => {
    const initialExpenses = StorageService.getExpenses();
    const corruptedJson = '{ appName: "FinTech", "expenses": [ broken-json ...';
    const result = validateBackupContent(corruptedJson, {
      filename: 'corrupted.json',
      size: corruptedJson.length,
    });

    assert.strictEqual(result.valid, false);
    assert.match(result.errors[0], /Malformed JSON file/);

    // Verify existing database was completely preserved
    const expensesAfter = StorageService.getExpenses();
    assert.strictEqual(expensesAfter.length, initialExpenses.length);
  });

  it('rejects files exceeding the maximum safe size limit', () => {
    const hugeFakeSize = MAX_BACKUP_FILE_SIZE + 1024;
    const result = validateBackupContent('{}', {
      filename: 'huge.json',
      size: hugeFakeSize,
    });

    assert.strictEqual(result.valid, false);
    assert.match(result.errors[0], /exceeds the maximum allowed limit/);
  });

  it('rejects backups with invalid currency codes', () => {
    const invalidCurrencyBackup = JSON.parse(JSON.stringify(validBackupSample));
    invalidCurrencyBackup.expenses[0].currency = 'USD'; // Invalid for FinTech

    const result = validateBackupContent(JSON.stringify(invalidCurrencyBackup), {
      filename: 'invalid_currency.json',
      size: 500,
    });

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('invalid currency "USD"')));
  });

  it('warns about broken relationship when repayment references unknown debt', () => {
    const brokenRelBackup = JSON.parse(JSON.stringify(validBackupSample));
    brokenRelBackup.repayments[0].debtId = 'non_existent_debt_999';

    const result = validateBackupContent(JSON.stringify(brokenRelBackup), {
      filename: 'broken_rel.json',
      size: 500,
    });

    assert.strictEqual(result.valid, true); // Non-fatal warning
    assert.ok(result.warnings.some(w => w.includes('references debt "non_existent_debt_999" not found')));
  });

  it('executes atomic clean replacement (REPLACE mode)', () => {
    const res = executeAtomicRestore(validBackupSample, 'REPLACE');
    assert.strictEqual(res.success, true);

    const savedIncomes = StorageService.getIncomes();
    const savedExpenses = StorageService.getExpenses();
    const savedDebts = StorageService.getDebts();

    assert.strictEqual(savedIncomes.length, 2);
    assert.strictEqual(savedExpenses.length, 2);
    assert.strictEqual(savedDebts.length, 2);
    assert.ok(savedIncomes.some(i => i.id === 'inc_aed_1'));
    assert.ok(savedIncomes.some(i => i.id === 'inc_inr_1'));
  });

  it('executes safe merge without creating duplicate transactions on repeated import', () => {
    // 1st restore
    executeAtomicRestore(validBackupSample, 'REPLACE');
    const countAfterFirst = StorageService.getExpenses().length;

    // 2nd restore with MERGE mode using the exact same data
    const mergeRes = executeAtomicRestore(validBackupSample, 'MERGE');
    assert.strictEqual(mergeRes.success, true);

    const countAfterSecond = StorageService.getExpenses().length;
    // Count should NOT double because duplicates are detected and skipped
    assert.strictEqual(countAfterSecond, countAfterFirst);
  });

  it('performs atomic rollback if storage write throws an exception', () => {
    // Save known initial state
    executeAtomicRestore(validBackupSample, 'REPLACE');
    const initialCategories = StorageService.getCategories();

    // Force an error during saveExpenses
    const originalSaveExpenses = StorageService.saveExpenses;
    StorageService.saveExpenses = () => {
      throw new Error('QuotaExceededError: Local storage full');
    };

    const newBackup: FullBackupData = {
      ...validBackupSample,
      categories: [],
    };

    const failRes = executeAtomicRestore(newBackup, 'REPLACE');
    assert.strictEqual(failRes.success, false);
    assert.match(failRes.message, /rolled back safely/);

    // Restore original method
    StorageService.saveExpenses = originalSaveExpenses;

    // Check that categories were rolled back to pre-failure state
    const categoriesAfterRollback = StorageService.getCategories();
    assert.strictEqual(categoriesAfterRollback.length, initialCategories.length);
  });
});
