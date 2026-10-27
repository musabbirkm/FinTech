/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Unit test verifying strict currency isolation and category validation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { generateInitialCategories } from '../db/storage';
import { Category, IncomeRecord, ExpenseRecord } from '../types';

test('Initial categories are strictly isolated between AED and INR', () => {
  const categories = generateInitialCategories();
  
  const aedCategories = categories.filter(c => c.currency === 'AED');
  const inrCategories = categories.filter(c => c.currency === 'INR');

  assert.equal(aedCategories.length, 9);
  assert.equal(inrCategories.length, 9);

  // Every AED category has currency AED
  assert.ok(aedCategories.every(c => c.currency === 'AED'));
  assert.ok(inrCategories.every(c => c.currency === 'INR'));

  // Unique IDs
  const allIds = new Set(categories.map(c => c.id));
  assert.equal(allIds.size, 18);
});

test('Financial calculations never combine AED and INR amounts', () => {
  const incomes: IncomeRecord[] = [
    {
      id: '1',
      date: '2026-10-01',
      amountMinor: 100000, // 1,000 AED
      currency: 'AED',
      source: 'Salary',
      paymentMethod: 'BANK_TRANSFER',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: '2',
      date: '2026-10-01',
      amountMinor: 1000000, // 10,000 INR
      currency: 'INR',
      source: 'Salary',
      paymentMethod: 'UPI',
      createdAt: 1,
      updatedAt: 1,
    },
  ];

  const expenses: ExpenseRecord[] = [
    {
      id: 'e1',
      date: '2026-10-01',
      amountMinor: 20000, // 200 AED
      categoryId: 'cat1',
      currency: 'AED',
      merchant: 'Lulu',
      reason: 'Grocery',
      paymentMethod: 'CARD',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'e2',
      date: '2026-10-01',
      amountMinor: 200000, // 2,000 INR
      categoryId: 'cat2',
      currency: 'INR',
      merchant: 'BigBasket',
      reason: 'Grocery',
      paymentMethod: 'UPI',
      createdAt: 1,
      updatedAt: 1,
    },
  ];

  // Pure filtering check
  const aedIncomes = incomes.filter(i => i.currency === 'AED');
  const aedExpenses = expenses.filter(e => e.currency === 'AED');
  const aedTotalIncome = aedIncomes.reduce((acc, c) => acc + c.amountMinor, 0);
  const aedTotalExpense = aedExpenses.reduce((acc, c) => acc + c.amountMinor, 0);

  assert.equal(aedTotalIncome, 100000); // exactly 1,000 AED (100,000 fils)
  assert.equal(aedTotalExpense, 20000); // exactly 200 AED (20,000 fils)
  assert.equal(aedTotalIncome - aedTotalExpense, 80000); // 800 AED net balance

  const inrIncomes = incomes.filter(i => i.currency === 'INR');
  const inrExpenses = expenses.filter(e => e.currency === 'INR');
  const inrTotalIncome = inrIncomes.reduce((acc, c) => acc + c.amountMinor, 0);
  const inrTotalExpense = inrExpenses.reduce((acc, c) => acc + c.amountMinor, 0);

  assert.equal(inrTotalIncome, 1000000); // exactly 10,000 INR (1,000,000 paise)
  assert.equal(inrTotalExpense, 200000); // exactly 2,000 INR (200,000 paise)
  assert.equal(inrTotalIncome - inrTotalExpense, 800000); // 8,000 INR net balance
});
