/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FinTech — Financial Data Center (Export & Backup / Import & Restore):
 * Area A: Complete multi-sheet Excel (.xlsx), CSV, and full JSON backup downloads.
 * Area B: In-depth backup upload, schema validation, preview, duplicate detection,
 * and safe atomic restoration for AED and INR records.
 * Developed by Musabbir KM | A Zavyani product (zavyani.xyz)
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { exportToExcel, exportToCSV, exportDualCurrencyToExcel } from '../utils/export';
import { StorageService } from '../db/storage';
import { getPeriodDateRange } from '../utils/money';
import { Footer } from '../components/Footer';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  validateBackupContent,
  executeAtomicRestore,
  BackupValidationResult,
} from '../utils/backupRestore';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Paperclip,
  Coins,
  AlertTriangle,
  AlertCircle,
  FileCheck2,
  RefreshCw,
  X,
  Database,
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Info,
} from 'lucide-react';

export const ExportScreen: React.FC = () => {
  const {
    currency,
    period,
    customRange,
    categories,
    incomes,
    expenses,
    debts,
    repayments,
    reminders,
    budgets,
    savingsGoals,
    attachments,
    periodIncomes,
    periodExpenses,
    refreshFromStorage,
    updateSettings,
  } = useApp();

  // Active page section toggle ('EXPORT' vs 'RESTORE')
  const [activeTab, setActiveTab] = useState<'EXPORT' | 'RESTORE'>('EXPORT');

  // Export States
  const [exportScope, setExportScope] = useState<'CURRENT_PERIOD' | 'ALL_TIME'>('CURRENT_PERIOD');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Restore States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; message: string } | null>(null);

  const activeDateRange = getPeriodDateRange(exportScope === 'ALL_TIME' ? 'ALL_TIME' : period, customRange);
  const selectedIncomes = exportScope === 'ALL_TIME' ? incomes : periodIncomes;
  const selectedExpenses = exportScope === 'ALL_TIME' ? expenses : periodExpenses;

  // Single Currency XLSX Export
  const handleExportSingleCurrencyXLSX = () => {
    exportToExcel({
      currency,
      periodName: exportScope === 'ALL_TIME' ? 'All Time Historical' : period,
      startDate: activeDateRange.startDate,
      endDate: activeDateRange.endDate,
      categories,
      incomes: selectedIncomes,
      expenses: selectedExpenses,
      debts,
      repayments,
      reminders,
      budgets,
      savingsGoals,
      attachments,
    });

    setDownloadSuccess(`Generated 9-sheet Excel workbook for ${currency}!`);
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  // Complete Dual-Currency XLSX Export (Both AED and INR)
  const handleExportDualCurrencyXLSX = () => {
    const allCategories = StorageService.getCategories();
    let allIncomes = StorageService.getIncomes();
    let allExpenses = StorageService.getExpenses();
    const allDebts = StorageService.getDebts();
    const allRepayments = StorageService.getRepayments();
    const allReminders = StorageService.getReminders();
    const allBudgets = StorageService.getBudgets();
    const allSavingsGoals = StorageService.getSavingsGoals();
    const allAttachments = StorageService.getAttachments();

    if (exportScope === 'CURRENT_PERIOD') {
      allIncomes = allIncomes.filter(i => i.date >= activeDateRange.startDate && i.date <= activeDateRange.endDate);
      allExpenses = allExpenses.filter(e => e.date >= activeDateRange.startDate && e.date <= activeDateRange.endDate);
    }

    exportDualCurrencyToExcel({
      periodName: exportScope === 'ALL_TIME' ? 'All Time Historical' : `${period} (${activeDateRange.startDate} to ${activeDateRange.endDate})`,
      categories: allCategories,
      incomes: allIncomes,
      expenses: allExpenses,
      debts: allDebts,
      repayments: allRepayments,
      reminders: allReminders,
      budgets: allBudgets,
      savingsGoals: allSavingsGoals,
      attachments: allAttachments,
    });

    setDownloadSuccess('Generated complete Dual-Currency Excel workbook (AED & INR with independent summaries and attachments)!');
    setTimeout(() => setDownloadSuccess(null), 6000);
  };

  // Single Currency CSV Export
  const handleExportCSV = () => {
    exportToCSV({
      currency,
      periodName: exportScope === 'ALL_TIME' ? 'All Time Historical' : period,
      startDate: activeDateRange.startDate,
      endDate: activeDateRange.endDate,
      categories,
      incomes: selectedIncomes,
      expenses: selectedExpenses,
      debts,
      repayments,
      reminders,
      budgets,
      savingsGoals,
      attachments,
    });

    setDownloadSuccess(`Exported transaction CSV file for ${currency}!`);
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  // Complete Dual-Currency JSON Full Backup Export
  const handleDownloadJsonBackup = () => {
    const backupData = StorageService.exportFullBackup();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeDate = new Date().toISOString().split('T')[0];
    link.download = `FinTech_Complete_Backup_All_${safeDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    updateSettings({ lastBackupDate: new Date().toISOString() });
    setDownloadSuccess('Downloaded complete FinTech JSON backup containing all AED & INR records and attachments.');
    setTimeout(() => setDownloadSuccess(null), 6000);
  };

  // Handle Backup File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setRestoreStatus(null);
    setIsValidating(true);

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = (event.target?.result as string) || '';
        const result = validateBackupContent(text, {
          filename: file.name,
          size: file.size,
        });
        setValidationResult(result);
      } catch (err: any) {
        setValidationResult({
          valid: false,
          errors: [`Failed to read file: ${err.message || 'Unknown error'}`],
          warnings: [],
          fileInfo: {
            filename: file.name,
            fileSizeBytes: file.size,
            fileSizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
          },
          schemaInfo: {
            appName: 'Unknown',
            version: 'Unknown',
            schemaVersion: 0,
            exportedAt: new Date().toISOString(),
          },
          aedCounts: {
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
          },
          inrCounts: {
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
          },
          totalRecords: 0,
          potentialDuplicates: {
            incomes: 0,
            expenses: 0,
            debts: 0,
            repayments: 0,
            reminders: 0,
            savingsGoals: 0,
            categories: 0,
            attachments: 0,
          },
          parsedData: null,
        });
      } finally {
        setIsValidating(false);
      }
    };

    reader.onerror = () => {
      setIsValidating(false);
      setRestoreStatus({
        success: false,
        message: 'Could not read the selected backup file from storage.',
      });
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setRestoreStatus(null);
  };

  // Execute Confirmed Restore
  const handleConfirmRestore = () => {
    if (!validationResult || !validationResult.valid || !validationResult.parsedData) {
      setRestoreStatus({
        success: false,
        message: 'Cannot restore: backup file failed validation checks.',
      });
      return;
    }

    const res = executeAtomicRestore(validationResult.parsedData, restoreMode);
    setRestoreStatus(res);

    if (res.success) {
      refreshFromStorage();
      clearSelectedFile();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen px-4 py-6 max-w-7xl mx-auto">
      {/* Page Title & Navigation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Financial Data Center
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Export & Restore
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Download complete financial workbooks or safely restore AED and INR ledgers with atomic protection.
          </p>
        </div>

        {/* Section Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('EXPORT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'EXPORT'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Export & Download</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RESTORE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'RESTORE'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Import & Restore</span>
          </button>
        </div>
      </div>

      {/* Global Status Notifications */}
      {downloadSuccess && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="font-semibold">{downloadSuccess}</span>
        </div>
      )}

      {restoreStatus && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center gap-2 text-xs shadow-lg animate-in fade-in ${
            restoreStatus.success
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {restoreStatus.success ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <span className="font-semibold">{restoreStatus.message}</span>
        </div>
      )}

      {/* =========================================================================
          AREA A: EXPORT & DOWNLOAD
         ========================================================================= */}
      {activeTab === 'EXPORT' && (
        <div className="space-y-6">
          {/* Scope Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              1. Select Export Scope & Range
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <button
                type="button"
                onClick={() => setExportScope('CURRENT_PERIOD')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  exportScope === 'CURRENT_PERIOD'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-sm font-bold block">Current Selected Period ({period})</span>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  Range: {activeDateRange.startDate} to {activeDateRange.endDate}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('ALL_TIME')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  exportScope === 'ALL_TIME'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-sm font-bold block">Full Historical Ledger (All Time)</span>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  All transactions recorded since beginning of time
                </span>
              </button>
            </div>
          </div>

          {/* Complete Dual-Currency Excel Export Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">
                    Complete Dual-Currency Export (AED & INR)
                  </h2>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Generates a single comprehensive multi-sheet Excel workbook containing all financial records for BOTH UAE Dirham (AED) and Indian Rupee (INR). Adheres strictly to currency isolation: separate summary tables for AED and INR (never combined into a single balance), with explicit currency indicators on every sheet.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportDualCurrencyXLSX}
                className="py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download Complete Dual-Currency XLSX</span>
              </button>
            </div>
          </div>

          {/* Complete JSON Backup Download Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-white">
                    Full System JSON Backup (.json)
                  </h2>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Complete Database
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Exports a verified JSON snapshot containing all AED and INR income, expenses, categories, debts, repayment logs, scheduled reminders, monthly budgets, savings goals, attachment references, and application preferences. This file can be restored anytime in Area B below.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadJsonBackup}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 hover:border-slate-600 shadow-md flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>Download Full JSON Backup</span>
              </button>
            </div>
          </div>

          {/* Single Currency Filtered Exports */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Single Currency Filtered Exports ({currency})</span>
              <span className="text-emerald-400 font-bold lowercase tracking-normal text-xs">
                active ledger only
              </span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Active Currency:</span>
                <strong className="text-white text-sm">{currency} ({currency === 'AED' ? 'د.إ' : '₹'})</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Income Transactions:</span>
                <strong className="text-emerald-400 text-sm">{selectedIncomes.length} records</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Expense Transactions:</span>
                <strong className="text-rose-400 text-sm">{selectedExpenses.length} records</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Debts & Credits:</span>
                <strong className="text-indigo-400 text-sm">{debts.length} records</strong>
              </div>
            </div>

            {/* 9 Worksheets Structure Summary */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-6">
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Each Excel workbook includes up to 9 structured worksheets:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>1. Summary Dashboard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>2. Income Transactions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>3. Expense Transactions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>4. Category Summary</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>5. Debts & Receivables</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>6. Repayment Logs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>7. Scheduled Reminders</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>8. Savings Goals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>9. Attachments & Receipts</span>
                </div>
              </div>
            </div>

            {/* Download Buttons for Single Currency */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleExportSingleCurrencyXLSX}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Download {currency} Excel (.xlsx) Workbook</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Download {currency} CSV File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          AREA B: IMPORT & RESTORE BACKUP
         ========================================================================= */}
      {activeTab === 'RESTORE' && (
        <div className="space-y-6">
          {/* Main Upload Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <span>Import & Restore Backup</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload a previously saved FinTech JSON backup file to inspect its contents and safely restore your financial records.
                </p>
              </div>

              {/* Upload Backup File Prominent Button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Backup File</span>
                </button>
              </div>
            </div>

            {/* Note on Google Drive compatibility & formats */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-300">File & Google Drive Compatibility:</strong> You can select files stored locally on your device or downloaded from Google Drive using the Android document picker. Backups are validated in memory before any data is modified.
              </div>
            </div>
          </div>

          {/* Validation Loader */}
          {isValidating && (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-bold text-white">Validating Backup File Structure...</p>
              <p className="text-[11px] text-slate-400">Inspecting schema version, currency records, and relationship constraints</p>
            </div>
          )}

          {/* File Selected & Validation Summary */}
          {validationResult && !isValidating && (
            <div className="space-y-6">
              {/* File Info Header */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {validationResult.fileInfo.filename}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Size: <strong className="text-slate-300">{validationResult.fileInfo.fileSizeFormatted}</strong> &bull; Exported: {new Date(validationResult.schemaInfo.exportedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1 self-start sm:self-auto"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear File</span>
                  </button>
                </div>

                {/* Validation Status Notice */}
                <div className="mt-4">
                  {validationResult.valid ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Validation Passed:</strong> Backup schema v{validationResult.schemaInfo.schemaVersion} is verified and ready for restoration.
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1.5 text-rose-300 text-xs">
                      <div className="flex items-center gap-2 font-bold text-rose-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Validation Failed: Found {validationResult.errors.length} fatal error(s)</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-200">
                        {validationResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-rose-300/80 pt-1">
                        Restoration is blocked until all schema errors are resolved. Your existing database remains completely untouched.
                      </p>
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-amber-300 text-xs">
                      <div className="flex items-center gap-2 font-bold text-amber-400">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Non-Fatal Warnings ({validationResult.warnings.length}):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px] text-amber-200">
                        {validationResult.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* DUAL-CURRENCY RECORD PREVIEWS */}
              {validationResult.valid && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* UAE Dirham (AED) Preview Card */}
                    <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          <h3 className="text-sm font-bold text-white">UAE Dirham (AED) Records</h3>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          AED Ledger
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Income Transactions</span>
                          <span className="text-emerald-400 font-bold block">{validationResult.aedCounts.incomes} records</span>
                          <span className="text-[10px] text-slate-500">Total: AED {validationResult.aedCounts.incomeTotalMajor.toLocaleString()}</span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Expense Transactions</span>
                          <span className="text-rose-400 font-bold block">{validationResult.aedCounts.expenses} records</span>
                          <span className="text-[10px] text-slate-500">Total: AED {validationResult.aedCounts.expenseTotalMajor.toLocaleString()}</span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Debts & Receivables</span>
                          <span className="text-white font-bold block">
                            {validationResult.aedCounts.debtsOwed} owed &bull; {validationResult.aedCounts.debtsReceivable} to me
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Repayment Logs</span>
                          <span className="text-cyan-400 font-bold block">{validationResult.aedCounts.repayments} records</span>
                          <span className="text-[10px] text-slate-500">Total: AED {validationResult.aedCounts.repaymentTotalMajor.toLocaleString()}</span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Reminders & Goals</span>
                          <span className="text-white font-bold block">
                            {validationResult.aedCounts.reminders} rem &bull; {validationResult.aedCounts.savingsGoals} goals
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Categories & Files</span>
                          <span className="text-white font-bold block">
                            {validationResult.aedCounts.categories} cats &bull; {validationResult.aedCounts.attachments} files
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Indian Rupee (INR) Preview Card */}
                    <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-5 shadow-xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                          <h3 className="text-sm font-bold text-white">Indian Rupee (INR) Records</h3>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          INR Ledger
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Income Transactions</span>
                          <span className="text-emerald-400 font-bold block">{validationResult.inrCounts.incomes} records</span>
                          <span className="text-[10px] text-slate-500">Total: ₹ {validationResult.inrCounts.incomeTotalMajor.toLocaleString()}</span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Expense Transactions</span>
                          <span className="text-rose-400 font-bold block">{validationResult.inrCounts.expenses} records</span>
                          <span className="text-[10px] text-slate-500">Total: ₹ {validationResult.inrCounts.expenseTotalMajor.toLocaleString()}</span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Debts & Receivables</span>
                          <span className="text-white font-bold block">
                            {validationResult.inrCounts.debtsOwed} owed &bull; {validationResult.inrCounts.debtsReceivable} to me
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Repayment Logs</span>
                          <span className="text-cyan-400 font-bold block">{validationResult.inrCounts.repayments} records</span>
                          <span className="text-[10px] text-slate-500">Total: ₹ {validationResult.inrCounts.repaymentTotalMajor.toLocaleString()}</span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Reminders & Goals</span>
                          <span className="text-white font-bold block">
                            {validationResult.inrCounts.reminders} rem &bull; {validationResult.inrCounts.savingsGoals} goals
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Categories & Files</span>
                          <span className="text-white font-bold block">
                            {validationResult.inrCounts.categories} cats &bull; {validationResult.inrCounts.attachments} files
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duplicate Audit Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Database Duplicate Inspection
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Existing Income Matches:</span>
                        <span className="text-white font-semibold">{validationResult.potentialDuplicates.incomes} records</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Existing Expense Matches:</span>
                        <span className="text-white font-semibold">{validationResult.potentialDuplicates.expenses} records</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Existing Debt Matches:</span>
                        <span className="text-white font-semibold">{validationResult.potentialDuplicates.debts} records</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Total Records in Backup:</span>
                        <span className="text-emerald-400 font-bold">{validationResult.totalRecords} records</span>
                      </div>
                    </div>
                  </div>

                  {/* Restore Mode Selection */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Select Safe Restore Mode
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Merge Mode */}
                      <label
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          restoreMode === 'MERGE'
                            ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="restoreModeChoice"
                            checked={restoreMode === 'MERGE'}
                            onChange={() => setRestoreMode('MERGE')}
                            className="mt-1 accent-emerald-500"
                          />
                          <div>
                            <span className="font-bold text-sm text-white block">
                              Merge with Existing Data (Recommended)
                            </span>
                            <span className="text-xs text-slate-300 mt-1 block leading-relaxed">
                              Adds records from this backup to your existing database. Fingerprint and ID checks prevent accidental duplicates if this backup was already imported.
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-400 mt-3 inline-block">
                          ✓ Zero data loss &bull; Preserves non-overlapping records
                        </span>
                      </label>

                      {/* Clean Replace Mode */}
                      <label
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          restoreMode === 'REPLACE'
                            ? 'bg-rose-500/10 border-rose-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="restoreModeChoice"
                            checked={restoreMode === 'REPLACE'}
                            onChange={() => setRestoreMode('REPLACE')}
                            className="mt-1 accent-rose-500"
                          />
                          <div>
                            <span className="font-bold text-sm text-rose-300 block">
                              Clean Replace (Overwrite Current Data)
                            </span>
                            <span className="text-xs text-slate-300 mt-1 block leading-relaxed">
                              Wipes existing financial tables and sets your database to exactly match this backup. Recommended when restoring an entire snapshot.
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-rose-400 mt-3 inline-block">
                          ⚠️ Destructive action &bull; Overwrites current records
                        </span>
                      </label>
                    </div>

                    {/* Commit Restore CTA */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={clearSelectedFile}
                        className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowConfirmModal(true)}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          restoreMode === 'REPLACE'
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50'
                        }`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>
                          {restoreMode === 'REPLACE'
                            ? 'Confirm & Replace Database'
                            : 'Confirm & Merge Records'}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && validationResult && (
        <ConfirmDialog
          isOpen={showConfirmModal}
          title={
            restoreMode === 'REPLACE'
              ? 'Destructive Action: Replace Active Financial Records?'
              : 'Confirm Data Merge into Active Ledger'
          }
          message={
            restoreMode === 'REPLACE'
              ? `You are about to overwrite all current transactions with ${validationResult.totalRecords} records from "${validationResult.fileInfo.filename}". Current unsaved modifications will be permanently replaced.`
              : `You are about to merge ${validationResult.totalRecords} records from "${validationResult.fileInfo.filename}" into your active ledger. Duplicate checks will prevent identical entries from multiplying.`
          }
          subMessage={
            restoreMode === 'REPLACE'
              ? 'Recommendation: Ensure you downloaded a fresh JSON backup before proceeding with a clean replacement.'
              : 'Atomic rollback is active: If any storage error occurs during import, the operation is reverted safely.'
          }
          confirmText={restoreMode === 'REPLACE' ? 'Overwrite & Replace Data' : 'Execute Safe Merge'}
          variant={restoreMode === 'REPLACE' ? 'danger' : 'primary'}
          onConfirm={handleConfirmRestore}
          onClose={() => setShowConfirmModal(false)}
        />
      )}

      {/* Official Developer Credit Footer */}
      <Footer />
    </div>
  );
};
