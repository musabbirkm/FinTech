/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Settings & About Screen:
 * Preferences, JSON full backup & restore (Merge or Clean Replace),
 * data sanitation, and official About & Developer credits.
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Currency } from '../types';
import { StorageService } from '../db/storage';
import { Footer } from '../components/Footer';
import {
  Settings,
  ShieldCheck,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  DollarSign,
  Palette,
  HardDrive,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    currency,
    setCurrency,
    settings,
    updateSettings,
    categories,
    incomes,
    expenses,
    debts,
    repayments,
    reminders,
    savingsGoals,
    restoreBackupData,
    resetAllData,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreMode, setRestoreMode] = useState<'MERGE' | 'REPLACE'>('REPLACE');
  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearInputConfirm, setClearInputConfirm] = useState('');

  // Handle JSON export
  const handleDownloadBackup = () => {
    const backupData = StorageService.exportFullBackup();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FinTech_Backup_${currency}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    updateSettings({ lastBackupDate: new Date().toISOString() });
    setRestoreStatus({
      success: true,
      message: 'JSON backup file successfully generated and downloaded.',
    });
  };

  // Handle JSON file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const res = restoreBackupData(content, restoreMode);
        setRestoreStatus(res);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Settings & Preferences
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
              v1.0.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure application defaults, manage local backups, and view developer information
          </p>
        </div>
      </div>

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
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <span className="font-semibold">{restoreStatus.message}</span>
        </div>
      )}

      {/* Grid of Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Section 1: General Preferences */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            General Preferences
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Default Startup Currency
            </label>
            <select
              value={settings.defaultCurrency}
              onChange={e => {
                const newCurr = e.target.value as Currency;
                updateSettings({ defaultCurrency: newCurr });
                setCurrency(newCurr);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="AED">AED — United Arab Emirates Dirham (د.إ)</option>
              <option value="INR">INR — Indian Rupee (₹)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Note: Changing this does NOT alter existing records. Both currencies remain strictly isolated.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Visual Theme
            </label>
            <select
              value={settings.theme}
              onChange={e => updateSettings({ theme: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="dark">Professional Dark (Default)</option>
              <option value="light">Crisp Light</option>
              <option value="system">Follow Device System Theme</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Date Formatting Display
            </label>
            <select
              value={settings.dateFormat}
              onChange={e => updateSettings({ dateFormat: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="YYYY-MM-DD">ISO Standard (YYYY-MM-DD)</option>
              <option value="DD/MM/YYYY">British / UAE (DD/MM/YYYY)</option>
              <option value="MM/DD/YYYY">US Format (MM/DD/YYYY)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Calendar Week Start Day
            </label>
            <select
              value={settings.weekStartDay}
              onChange={e => updateSettings({ weekStartDay: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="MONDAY">Monday (Standard)</option>
              <option value="SUNDAY">Sunday</option>
            </select>
          </div>
        </div>

        {/* Section 2: Storage & JSON Backup / Restore */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            Local Database & JSON Backup
          </h2>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 block">Current Database Entities:</span>
            <div className="grid grid-cols-2 gap-2 mt-2 text-slate-400 text-[11px]">
              <span>Categories: <strong className="text-white">{categories.length}</strong></span>
              <span>Incomes: <strong className="text-white">{incomes.length}</strong></span>
              <span>Expenses: <strong className="text-white">{expenses.length}</strong></span>
              <span>Debts & Credits: <strong className="text-white">{debts.length}</strong></span>
              <span>Repayments: <strong className="text-white">{repayments.length}</strong></span>
              <span>Reminders: <strong className="text-white">{reminders.length}</strong></span>
            </div>
            {settings.lastBackupDate && (
              <span className="text-[10px] text-emerald-400 block mt-2">
                Last backup: {new Date(settings.lastBackupDate).toLocaleString()}
              </span>
            )}
          </div>

          {/* Download JSON Backup Button */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Full JSON Backup</span>
          </button>

          {/* Restore JSON Backup */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Restore from Backup File
            </label>
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="radio"
                  name="restoreMode"
                  checked={restoreMode === 'REPLACE'}
                  onChange={() => setRestoreMode('REPLACE')}
                  className="accent-emerald-500"
                />
                <span>Clean Replace</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="radio"
                  name="restoreMode"
                  checked={restoreMode === 'MERGE'}
                  onChange={() => setRestoreMode('MERGE')}
                  className="accent-emerald-500"
                />
                <span>Merge with Existing</span>
              </label>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-emerald-500/30 transition-all"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Select JSON File to Restore</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Official About & Developer Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          About & Developer Information
        </h2>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-400">Application Name:</span>
            <span className="font-extrabold text-white text-sm">FinTech</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-400">Official Product Title:</span>
            <span className="font-bold text-white">FinTech — Dirham & Rupee Smart Expense Tracker</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-400">Lead Architect & Developer:</span>
            <span className="font-extrabold text-emerald-400 text-sm">Musabbir KM</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-400">Developer Credit:</span>
            <span className="font-semibold text-slate-200">Developed by Musabbir KM</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-400">Company & Brand:</span>
            <span className="font-bold text-white">Zavyani</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-400">Company Credit:</span>
            <span className="font-semibold text-slate-200">A Zavyani product</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-400">Official Website / Domain:</span>
            <a
              href="https://zavyani.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1"
            >
              <span>zavyani.xyz</span>
              <span className="text-[10px]">&#8599;</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-400">Support & Developer Email:</span>
            <a
              href="mailto:zavyani@zavyani.xyz"
              className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1"
            >
              <span>zavyani@zavyani.xyz</span>
              <span className="text-[10px]">&#9993;</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-400">Initial Release Version:</span>
            <span className="font-semibold text-slate-200">1.0.0</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-400">Supported Currencies:</span>
            <span className="font-semibold text-slate-200">
              AED (United Arab Emirates Dirham) &bull; INR (Indian Rupee)
            </span>
          </div>

          <div className="pt-2">
            <span className="text-slate-400 block mb-1">Architecture Description:</span>
            <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              A personal finance management application for tracking income, expenses, budgets, debts, credits, repayments, and financial reports in AED and INR. Designed with zero cross-currency pollution, strict integer minor-unit calculations (fils and paise), local room persistence, and full export capabilities.
            </p>
          </div>

          <div className="pt-2">
            <span className="text-slate-400 block mb-1">Privacy & Data Statement:</span>
            <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              The core financial features store records locally on the device and do not send them to external servers. No third-party financial tracking, telemetry, or remote API synchronization is performed.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 shadow-xl mb-8">
        <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          Danger Zone
        </h2>
        <p className="text-xs text-rose-200/80 mb-4">
          Permanently erase all incomes, expenses, custom categories, debts, and repayments. Default seed categories will be regenerated.
        </p>

        {!showClearConfirm ? (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/40 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Local Financial Data</span>
          </button>
        ) : (
          <div className="p-4 bg-slate-950 rounded-xl border border-rose-500/40 space-y-3">
            <p className="text-xs text-rose-300 font-semibold">
              Type <span className="font-mono bg-rose-500/20 px-1 py-0.5 rounded text-white">RESET</span> to confirm destructive data wipe:
            </p>
            <input
              type="text"
              value={clearInputConfirm}
              onChange={e => setClearInputConfirm(e.target.value)}
              placeholder="RESET"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={clearInputConfirm !== 'RESET'}
                onClick={() => {
                  resetAllData();
                  setShowClearConfirm(false);
                  setClearInputConfirm('');
                  setRestoreStatus({
                    success: true,
                    message: 'All local database records wiped and initialized with clean structure.',
                  });
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl ${
                  clearInputConfirm === 'RESET'
                    ? 'bg-rose-500 text-white hover:bg-rose-400'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Permanently Wipe Database
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearInputConfirm('');
                }}
                className="px-3 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};
