/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Financial export utilities for genuine multi-sheet Excel (.xlsx) workbooks and CSV files.
 * Adheres strictly to AED / INR currency isolation with comprehensive dual-currency export support.
 */

import * as XLSX from 'xlsx';
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
} from '../types';
import { formatMoney, toMajorUnits, calculateOutstandingDebt } from './money';
import { formatFileSize } from './attachments';

export interface ExportDataPayload {
  currency: Currency;
  periodName: string;
  startDate: string;
  endDate: string;
  categories: Category[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  debts: DebtRecord[];
  repayments: RepaymentRecord[];
  reminders: ReminderRecord[];
  budgets?: BudgetRecord[];
  savingsGoals: SavingsGoal[];
  attachments?: AttachmentRecord[];
}

export interface DualCurrencyExportPayload {
  periodName: string;
  categories: Category[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  debts: DebtRecord[];
  repayments: RepaymentRecord[];
  reminders: ReminderRecord[];
  budgets?: BudgetRecord[];
  savingsGoals: SavingsGoal[];
  attachments?: AttachmentRecord[];
}

/**
 * Exports complete financial records for BOTH AED and INR into a unified multi-sheet workbook,
 * strictly keeping summary tables separate (no blended totals) and labeling currency on every row.
 */
export function exportDualCurrencyToExcel(
  data: DualCurrencyExportPayload,
  filenamePrefix = 'FinTech_Complete_Dual_Currency'
): void {
  const {
    periodName,
    categories,
    incomes,
    expenses,
    debts,
    repayments,
    reminders,
    savingsGoals,
    attachments = [],
  } = data;

  const wb = XLSX.utils.book_new();

  // 1. EXECUTIVE SUMMARY SHEET WITH STRICT SEPARATION
  const aedIncomes = incomes.filter(i => i.currency === 'AED');
  const inrIncomes = incomes.filter(i => i.currency === 'INR');

  const aedExpenses = expenses.filter(e => e.currency === 'AED');
  const inrExpenses = expenses.filter(e => e.currency === 'INR');

  const aedTotalIncome = aedIncomes.reduce((acc, i) => acc + i.amountMinor, 0);
  const inrTotalIncome = inrIncomes.reduce((acc, i) => acc + i.amountMinor, 0);

  const aedTotalExpense = aedExpenses.reduce((acc, e) => acc + e.amountMinor, 0);
  const inrTotalExpense = inrExpenses.reduce((acc, e) => acc + e.amountMinor, 0);

  const aedNet = aedTotalIncome - aedTotalExpense;
  const inrNet = inrTotalIncome - inrTotalExpense;

  const aedDebts = debts.filter(d => d.currency === 'AED');
  const inrDebts = debts.filter(d => d.currency === 'INR');

  const aedRepayments = repayments.filter(r => r.currency === 'AED');
  const inrRepayments = repayments.filter(r => r.currency === 'INR');

  const aedOwed = aedDebts
    .filter(d => d.type === 'DEBIT')
    .reduce((acc, d) => acc + calculateOutstandingDebt(d, aedRepayments).outstandingMinor, 0);

  const aedReceivable = aedDebts
    .filter(d => d.type === 'CREDIT')
    .reduce((acc, d) => acc + calculateOutstandingDebt(d, aedRepayments).outstandingMinor, 0);

  const inrOwed = inrDebts
    .filter(d => d.type === 'DEBIT')
    .reduce((acc, d) => acc + calculateOutstandingDebt(d, inrRepayments).outstandingMinor, 0);

  const inrReceivable = inrDebts
    .filter(d => d.type === 'CREDIT')
    .reduce((acc, d) => acc + calculateOutstandingDebt(d, inrRepayments).outstandingMinor, 0);

  const summaryRows = [
    ['FINTECH — DIRHAM & RUPEE SMART EXPENSE TRACKER', ''],
    ['Developer Credit', 'FinTech © 2026 | Developed by Musabbir KM'],
    ['Export Timestamp', new Date().toISOString()],
    ['Scope', `Complete Dual-Currency Ledger (${periodName})`],
    ['Currency Isolation Policy', 'STRICT: AED and INR are never blended, converted, or summed into a single total.'],
    ['', ''],
    ['=== UAE DIRHAM (AED) PERFORMANCE ===', ''],
    ['AED Total Income', toMajorUnits(aedTotalIncome, 'AED')],
    ['AED Total Expenses', toMajorUnits(aedTotalExpense, 'AED')],
    ['AED Net Operational Balance', toMajorUnits(aedNet, 'AED')],
    ['AED Money I Owe (Active Debts)', toMajorUnits(aedOwed, 'AED')],
    ['AED Money Owed to Me (Receivables)', toMajorUnits(aedReceivable, 'AED')],
    ['AED Income Transactions Count', aedIncomes.length],
    ['AED Expense Transactions Count', aedExpenses.length],
    ['', ''],
    ['=== INDIAN RUPEE (INR) PERFORMANCE ===', ''],
    ['INR Total Income', toMajorUnits(inrTotalIncome, 'INR')],
    ['INR Total Expenses', toMajorUnits(inrTotalExpense, 'INR')],
    ['INR Net Operational Balance', toMajorUnits(inrNet, 'INR')],
    ['INR Money I Owe (Active Debts)', toMajorUnits(inrOwed, 'INR')],
    ['INR Money Owed to Me (Receivables)', toMajorUnits(inrReceivable, 'INR')],
    ['INR Income Transactions Count', inrIncomes.length],
    ['INR Expense Transactions Count', inrExpenses.length],
    ['', ''],
    ['=== OVERALL SYSTEM METRICS ===', ''],
    ['Total Registered Categories', categories.length],
    ['Total Debts & Receivables', debts.length],
    ['Total Repayment Records', repayments.length],
    ['Total Scheduled Reminders', reminders.length],
    ['Total Savings Goals', savingsGoals.length],
    ['Total Uploaded Attachments', attachments.length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Dual-Currency Summary');

  // 2. INCOMES SHEET (with Currency column)
  const incomeHeaders = ['Transaction ID', 'Currency', 'Date', 'Amount', 'Source', 'Payment Method', 'Description', 'Tags'];
  const incomeRows = incomes.map(inc => [
    inc.id,
    inc.currency,
    inc.date,
    toMajorUnits(inc.amountMinor, inc.currency),
    inc.source,
    inc.paymentMethod,
    inc.description || '',
    (inc.tags || []).join(', '),
  ]);
  const wsIncome = XLSX.utils.aoa_to_sheet([incomeHeaders, ...incomeRows]);
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Incomes');

  // 3. EXPENSES SHEET (with Currency column)
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const expenseHeaders = [
    'Transaction ID',
    'Currency',
    'Date',
    'Amount',
    'Category',
    'Merchant / Recipient',
    'Reason for Spending',
    'Payment Method',
    'Notes',
  ];
  const expenseRows = expenses.map(exp => [
    exp.id,
    exp.currency,
    exp.date,
    toMajorUnits(exp.amountMinor, exp.currency),
    catMap.get(exp.categoryId) || 'Uncategorized',
    exp.merchant,
    exp.reason,
    exp.paymentMethod,
    exp.notes || '',
  ]);
  const wsExpenses = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows]);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

  // 4. CATEGORIES SHEET
  const catHeaders = ['Category ID', 'Currency', 'Category Name', 'Monthly Budget', 'Custom Category', 'Archived'];
  const catRows = categories.map(cat => [
    cat.id,
    cat.currency,
    cat.name,
    cat.monthlyBudgetMinor ? toMajorUnits(cat.monthlyBudgetMinor, cat.currency) : 'No Budget',
    cat.isCustom ? 'YES' : 'NO',
    cat.isArchived ? 'YES' : 'NO',
  ]);
  const wsCategories = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');

  // 5. DEBTS AND RECEIVABLES SHEET
  const debtHeaders = [
    'Debt ID',
    'Currency',
    'Type',
    'Person / Organization',
    'Original Principal',
    'Repaid / Collected',
    'Outstanding Balance',
    'Start Date',
    'Due Date',
    'Status',
    'Reason',
    'Contact Info',
  ];
  const debtRows = debts.map(debt => {
    const calc = calculateOutstandingDebt(debt, repayments);
    return [
      debt.id,
      debt.currency,
      debt.type === 'DEBIT' ? 'Money I Owe (Debit)' : 'Money Owed to Me (Credit)',
      debt.personName,
      toMajorUnits(debt.originalAmountMinor, debt.currency),
      toMajorUnits(calc.repaidMinor, debt.currency),
      toMajorUnits(calc.outstandingMinor, debt.currency),
      debt.startDate,
      debt.dueDate || 'No Due Date',
      debt.status,
      debt.reason,
      debt.contactInfo || '',
    ];
  });
  const wsDebts = XLSX.utils.aoa_to_sheet([debtHeaders, ...debtRows]);
  XLSX.utils.book_append_sheet(wb, wsDebts, 'Debts & Receivables');

  // 6. REPAYMENTS SHEET
  const debtNameMap = new Map(debts.map(d => [d.id, `${d.personName} (${d.type} - ${d.currency})`]));
  const repayHeaders = ['Repayment ID', 'Debt / Receivable', 'Currency', 'Date', 'Amount', 'Payment Method', 'Source / Destination', 'Notes'];
  const repayRows = repayments.map(rep => [
    rep.id,
    debtNameMap.get(rep.debtId) || rep.debtId,
    rep.currency,
    rep.date,
    toMajorUnits(rep.amountMinor, rep.currency),
    rep.paymentMethod,
    rep.paymentSourceOrDest || '',
    rep.notes || '',
  ]);
  const wsRepayments = XLSX.utils.aoa_to_sheet([repayHeaders, ...repayRows]);
  XLSX.utils.book_append_sheet(wb, wsRepayments, 'Repayments');

  // 7. REMINDERS SHEET
  const reminderHeaders = ['Title', 'Currency', 'Person / Organization', 'Due Date', 'Amount', 'Repeat Schedule', 'Status', 'Notes'];
  const reminderRows = reminders.map(rem => [
    rem.title,
    rem.currency,
    rem.personOrOrg,
    rem.dueDate,
    rem.amountMinor ? toMajorUnits(rem.amountMinor, rem.currency) : 'N/A',
    rem.repeatSchedule,
    rem.status,
    rem.notes || '',
  ]);
  const wsReminders = XLSX.utils.aoa_to_sheet([reminderHeaders, ...reminderRows]);
  XLSX.utils.book_append_sheet(wb, wsReminders, 'Reminders');

  // 8. SAVINGS GOALS SHEET
  const savingsHeaders = ['Goal Name', 'Currency', 'Target Amount', 'Saved So Far', 'Progress (%)', 'Target Date', 'Notes'];
  const savingsRows = savingsGoals.map(goal => {
    const pct = goal.targetAmountMinor > 0 ? ((goal.currentAmountMinor / goal.targetAmountMinor) * 100).toFixed(1) + '%' : '0%';
    return [
      goal.name,
      goal.currency,
      toMajorUnits(goal.targetAmountMinor, goal.currency),
      toMajorUnits(goal.currentAmountMinor, goal.currency),
      pct,
      goal.targetDate,
      goal.notes || '',
    ];
  });
  const wsSavings = XLSX.utils.aoa_to_sheet([savingsHeaders, ...savingsRows]);
  XLSX.utils.book_append_sheet(wb, wsSavings, 'Savings Goals');

  // 9. ATTACHMENTS & RECEIPTS SHEET
  const attachmentHeaders = ['Attachment ID', 'Record Type', 'Record ID', 'Currency', 'File Name', 'Format / MIME', 'File Size', 'Uploaded Date'];
  const attachmentRows = attachments.map(att => [
    att.id,
    att.recordType,
    att.recordId,
    att.currency,
    att.originalFilename,
    att.mimeType,
    formatFileSize(att.fileSize),
    new Date(att.createdAt).toISOString(),
  ]);
  const wsAttachments = XLSX.utils.aoa_to_sheet([attachmentHeaders, ...attachmentRows]);
  XLSX.utils.book_append_sheet(wb, wsAttachments, 'Attachments & Receipts');

  const safeDate = new Date().toISOString().split('T')[0];
  const finalFilename = `${filenamePrefix}_${safeDate}.xlsx`;
  XLSX.writeFile(wb, finalFilename);
}

/**
 * Exports single-currency filtered financial records into an Excel workbook.
 */
export function exportToExcel(data: ExportDataPayload, filenamePrefix = 'FinTech_Report'): void {
  const {
    currency,
    periodName,
    startDate,
    endDate,
    categories,
    incomes,
    expenses,
    debts,
    repayments,
    reminders,
    savingsGoals,
    attachments = [],
  } = data;

  const wb = XLSX.utils.book_new();

  // 1. SUMMARY SHEET
  const totalIncomeMinor = incomes.reduce((acc, curr) => acc + curr.amountMinor, 0);
  const totalExpenseMinor = expenses.reduce((acc, curr) => acc + curr.amountMinor, 0);
  const netBalanceMinor = totalIncomeMinor - totalExpenseMinor;

  const activeDebts = debts.filter(d => d.type === 'DEBIT');
  const activeCredits = debts.filter(d => d.type === 'CREDIT');

  const totalOwedMinor = activeDebts.reduce((acc, d) => {
    return acc + calculateOutstandingDebt(d, repayments).outstandingMinor;
  }, 0);

  const totalReceivableMinor = activeCredits.reduce((acc, d) => {
    return acc + calculateOutstandingDebt(d, repayments).outstandingMinor;
  }, 0);

  const summaryRows = [
    ['FINTECH — DIRHAM & RUPEE SMART EXPENSE TRACKER', ''],
    ['Developer Credit', 'FinTech © 2026 | Developed by Musabbir KM'],
    ['Export Timestamp', new Date().toISOString()],
    ['Selected Currency', currency],
    ['Reporting Period', `${periodName} (${startDate} to ${endDate})`],
    ['', ''],
    ['FINANCIAL PERFORMANCE METRIC', `AMOUNT (${currency})`],
    ['Total Income', toMajorUnits(totalIncomeMinor, currency)],
    ['Total Expenses', toMajorUnits(totalExpenseMinor, currency)],
    ['Net Operational Balance', toMajorUnits(netBalanceMinor, currency)],
    ['Total Money I Owe (Debts Outstanding)', toMajorUnits(totalOwedMinor, currency)],
    ['Total Money Owed to Me (Receivables Outstanding)', toMajorUnits(totalReceivableMinor, currency)],
    ['Total Income Transactions', incomes.length],
    ['Total Expense Transactions', expenses.length],
    ['Active Debts / Receivables Count', debts.length],
    ['Attached Receipts Count', attachments.length],
    ['', ''],
    ['Note', 'AED and INR financial ledgers are completely independent. No cross-currency mixing.'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // 2. INCOME SHEET
  const incomeHeaders = ['Transaction ID', 'Currency', 'Date', `Amount (${currency})`, 'Source', 'Payment Method', 'Description', 'Tags'];
  const incomeRows = incomes.map(inc => [
    inc.id,
    inc.currency,
    inc.date,
    toMajorUnits(inc.amountMinor, currency),
    inc.source,
    inc.paymentMethod,
    inc.description || '',
    (inc.tags || []).join(', '),
  ]);
  const wsIncome = XLSX.utils.aoa_to_sheet([incomeHeaders, ...incomeRows]);
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Income');

  // 3. EXPENSES SHEET
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const expenseHeaders = [
    'Transaction ID',
    'Currency',
    'Date',
    `Amount (${currency})`,
    'Category',
    'Merchant / Recipient',
    'Reason for Spending',
    'Payment Method',
    'Notes',
  ];
  const expenseRows = expenses.map(exp => [
    exp.id,
    exp.currency,
    exp.date,
    toMajorUnits(exp.amountMinor, currency),
    catMap.get(exp.categoryId) || 'Uncategorized',
    exp.merchant,
    exp.reason,
    exp.paymentMethod,
    exp.notes || '',
  ]);
  const wsExpenses = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows]);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

  // 4. CATEGORY SUMMARY SHEET
  const catSummaryHeaders = ['Category Name', `Total Spending (${currency})`, `Monthly Budget (${currency})`, 'Budget Utilization (%)', 'Transaction Count'];
  const catSummaryRows = categories.map(cat => {
    const catExpenses = expenses.filter(e => e.categoryId === cat.id);
    const spentMinor = catExpenses.reduce((sum, e) => sum + e.amountMinor, 0);
    const budgetMinor = cat.monthlyBudgetMinor || 0;
    const utilization = budgetMinor > 0 ? ((spentMinor / budgetMinor) * 100).toFixed(1) + '%' : 'N/A';
    return [
      cat.name,
      toMajorUnits(spentMinor, currency),
      budgetMinor > 0 ? toMajorUnits(budgetMinor, currency) : 'No Budget',
      utilization,
      catExpenses.length,
    ];
  });
  const wsCatSummary = XLSX.utils.aoa_to_sheet([catSummaryHeaders, ...catSummaryRows]);
  XLSX.utils.book_append_sheet(wb, wsCatSummary, 'Category Summary');

  // 5. DEBTS AND RECEIVABLES SHEET
  const debtHeaders = [
    'Debt ID',
    'Type',
    'Person / Organization',
    `Original Principal (${currency})`,
    `Repaid / Collected (${currency})`,
    `Outstanding Balance (${currency})`,
    'Start Date',
    'Due Date',
    'Status',
    'Reason',
    'Contact Info',
  ];
  const debtRows = debts.map(debt => {
    const calc = calculateOutstandingDebt(debt, repayments);
    return [
      debt.id,
      debt.type === 'DEBIT' ? 'Money I Owe (Debit)' : 'Money Owed to Me (Credit)',
      debt.personName,
      toMajorUnits(debt.originalAmountMinor, currency),
      toMajorUnits(calc.repaidMinor, currency),
      toMajorUnits(calc.outstandingMinor, currency),
      debt.startDate,
      debt.dueDate || 'No Due Date',
      debt.status,
      debt.reason,
      debt.contactInfo || '',
    ];
  });
  const wsDebts = XLSX.utils.aoa_to_sheet([debtHeaders, ...debtRows]);
  XLSX.utils.book_append_sheet(wb, wsDebts, 'Debts & Receivables');

  // 6. REPAYMENTS SHEET
  const debtNameMap = new Map(debts.map(d => [d.id, `${d.personName} (${d.type})`]));
  const repayHeaders = ['Repayment ID', 'Debt / Receivable', 'Date', `Amount (${currency})`, 'Payment Method', 'Source / Destination', 'Notes'];
  const repayRows = repayments.map(rep => [
    rep.id,
    debtNameMap.get(rep.debtId) || rep.debtId,
    rep.date,
    toMajorUnits(rep.amountMinor, currency),
    rep.paymentMethod,
    rep.paymentSourceOrDest || '',
    rep.notes || '',
  ]);
  const wsRepayments = XLSX.utils.aoa_to_sheet([repayHeaders, ...repayRows]);
  XLSX.utils.book_append_sheet(wb, wsRepayments, 'Repayments');

  // 7. REMINDERS SHEET
  const reminderHeaders = ['Title', 'Person / Organization', 'Due Date', `Amount (${currency})`, 'Repeat Schedule', 'Status', 'Notes'];
  const reminderRows = reminders.map(rem => [
    rem.title,
    rem.personOrOrg,
    rem.dueDate,
    rem.amountMinor ? toMajorUnits(rem.amountMinor, currency) : 'N/A',
    rem.repeatSchedule,
    rem.status,
    rem.notes || '',
  ]);
  const wsReminders = XLSX.utils.aoa_to_sheet([reminderHeaders, ...reminderRows]);
  XLSX.utils.book_append_sheet(wb, wsReminders, 'Reminders');

  // 8. SAVINGS GOALS SHEET
  const savingsHeaders = ['Goal Name', `Target Amount (${currency})`, `Saved So Far (${currency})`, 'Progress (%)', 'Target Date', 'Notes'];
  const savingsRows = savingsGoals.map(goal => {
    const pct = goal.targetAmountMinor > 0 ? ((goal.currentAmountMinor / goal.targetAmountMinor) * 100).toFixed(1) + '%' : '0%';
    return [
      goal.name,
      toMajorUnits(goal.targetAmountMinor, currency),
      toMajorUnits(goal.currentAmountMinor, currency),
      pct,
      goal.targetDate,
      goal.notes || '',
    ];
  });
  const wsSavings = XLSX.utils.aoa_to_sheet([savingsHeaders, ...savingsRows]);
  XLSX.utils.book_append_sheet(wb, wsSavings, 'Savings Goals');

  // 9. ATTACHMENTS SHEET
  if (attachments.length > 0) {
    const attachmentHeaders = ['Attachment ID', 'Record Type', 'Record ID', 'File Name', 'Format / MIME', 'File Size', 'Uploaded Date'];
    const attachmentRows = attachments.map(att => [
      att.id,
      att.recordType,
      att.recordId,
      att.originalFilename,
      att.mimeType,
      formatFileSize(att.fileSize),
      new Date(att.createdAt).toISOString(),
    ]);
    const wsAttachments = XLSX.utils.aoa_to_sheet([attachmentHeaders, ...attachmentRows]);
    XLSX.utils.book_append_sheet(wb, wsAttachments, 'Attachments');
  }

  // Trigger browser download of genuine .xlsx workbook
  const safeDate = new Date().toISOString().split('T')[0];
  const finalFilename = `${filenamePrefix}_${currency}_${safeDate}.xlsx`;
  XLSX.writeFile(wb, finalFilename);
}

export function exportToCSV(data: ExportDataPayload, filenamePrefix = 'FinTech_Transactions'): void {
  const { currency, categories, incomes, expenses } = data;
  const catMap = new Map(categories.map(c => [c.id, c.name]));

  const rows: string[][] = [
    ['Type', 'Currency', 'ID', 'Date', `Amount_${currency}`, 'Category_or_Source', 'Entity_or_Merchant', 'Payment_Method', 'Description_or_Reason'],
  ];

  for (const inc of incomes) {
    rows.push([
      'INCOME',
      inc.currency,
      inc.id,
      inc.date,
      toMajorUnits(inc.amountMinor, currency).toString(),
      inc.source,
      'Income Deposit',
      inc.paymentMethod,
      `"${(inc.description || '').replace(/"/g, '""')}"`,
    ]);
  }

  for (const exp of expenses) {
    rows.push([
      'EXPENSE',
      exp.currency,
      exp.id,
      exp.date,
      toMajorUnits(exp.amountMinor, currency).toString(),
      catMap.get(exp.categoryId) || 'Uncategorized',
      `"${exp.merchant.replace(/"/g, '""')}"`,
      exp.paymentMethod,
      `"${exp.reason.replace(/"/g, '""')}"`,
    ]);
  }

  const csvContent = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeDate = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${filenamePrefix}_${currency}_${safeDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
