import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  toMinorUnits,
  toMajorUnits,
  formatMoney,
  calculateOutstandingDebt,
} from './money';
import { DebtRecord, RepaymentRecord } from '../types';

describe('Money and Currency Ledger Utilities', () => {
  it('converts major units to minor units (fils and paise) with rounding precision', () => {
    assert.strictEqual(toMinorUnits(120.50, 'AED'), 12050);
    assert.strictEqual(toMinorUnits('45.99', 'AED'), 4599);
    assert.strictEqual(toMinorUnits(500, 'INR'), 50000);
    assert.strictEqual(toMinorUnits('0.05', 'INR'), 5);
  });

  it('converts minor units back to major units without floating point distortion', () => {
    assert.strictEqual(toMajorUnits(12050, 'AED'), 120.5);
    assert.strictEqual(toMajorUnits(4599, 'AED'), 45.99);
    assert.strictEqual(toMajorUnits(50000, 'INR'), 500);
  });

  it('formats money with proper currency symbols and 2 decimal places', () => {
    const formattedAED = formatMoney(150000, 'AED');
    assert.ok(formattedAED.includes('1,500.00'));
    assert.ok(formattedAED.includes('AED') || formattedAED.includes('د.إ'));

    const formattedINR = formatMoney(250000, 'INR');
    assert.ok(formattedINR.includes('2,500.00'));
    assert.ok(formattedINR.includes('₹') || formattedINR.includes('INR'));
  });

  it('accurately calculates outstanding debt balances and handles partial and full repayments', () => {
    const debt: DebtRecord = {
      id: 'debt_1',
      currency: 'AED',
      type: 'DEBIT',
      personName: 'Ahmed Al Mansoor',
      originalAmountMinor: 100000, // 1,000.00 AED
      startDate: '2026-01-01',
      status: 'ACTIVE',
      reason: 'Rent advance assistance',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const repayments: RepaymentRecord[] = [
      {
        id: 'rep_1',
        currency: 'AED',
        debtId: 'debt_1',
        amountMinor: 30000, // 300.00 AED
        date: '2026-01-15',
        paymentMethod: 'BANK_TRANSFER',
        createdAt: Date.now(),
      },
      {
        id: 'rep_2',
        currency: 'AED',
        debtId: 'debt_1',
        amountMinor: 20000, // 200.00 AED
        date: '2026-02-01',
        paymentMethod: 'CASH',
        createdAt: Date.now(),
      },
    ];

    const result = calculateOutstandingDebt(debt, repayments);
    assert.strictEqual(result.repaidMinor, 50000);
    assert.strictEqual(result.outstandingMinor, 50000);
    assert.strictEqual(result.isFullyPaid, false);

    // Add remaining settlement
    const fullRepayments: RepaymentRecord[] = [
      ...repayments,
      {
        id: 'rep_3',
        currency: 'AED',
        debtId: 'debt_1',
        amountMinor: 50000,
        date: '2026-02-15',
        paymentMethod: 'BANK_TRANSFER',
        createdAt: Date.now(),
      },
    ];

    const fullResult = calculateOutstandingDebt(debt, fullRepayments);
    assert.strictEqual(fullResult.repaidMinor, 100000);
    assert.strictEqual(fullResult.outstandingMinor, 0);
    assert.strictEqual(fullResult.isFullyPaid, true);
  });
});
