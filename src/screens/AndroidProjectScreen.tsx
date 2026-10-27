/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Android Native Architecture & Project Viewer.
 * Explains native Kotlin / Compose / Room stack, and provides Android Studio build instructions.
 */

import React, { useState } from 'react';
import { Footer } from '../components/Footer';
import {
  Smartphone,
  FolderTree,
  Terminal,
  CheckCircle2,
  Layers,
  Cpu,
  ShieldCheck,
  ExternalLink,
  Code2,
  Copy,
  Check,
} from 'lucide-react';

export const AndroidProjectScreen: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const projectPackages = [
    {
      name: 'com.musabbir.fintech.config',
      desc: 'Centralized branding, official developer credit ("Musabbir KM"), app identity & currency configs.',
      files: ['AppConfig.kt'],
    },
    {
      name: 'com.musabbir.fintech.domain.model',
      desc: 'Clean financial models (Income, Expense, Category, Debt, Repayment, Reminder, SavingsGoal) & Enums.',
      files: ['Models.kt'],
    },
    {
      name: 'com.musabbir.fintech.domain.calculations',
      desc: 'Authoritative integer minor-unit math (fils/paise), debt outstanding balance reduction, and strict AED/INR isolation.',
      files: ['FinancialCalculations.kt'],
    },
    {
      name: 'com.musabbir.fintech.data.local',
      desc: 'Room SQLite database with pre-population callback for AED and INR standard categories.',
      files: ['FinTechDatabase.kt'],
    },
    {
      name: 'com.musabbir.fintech.data.local.entity',
      desc: 'Room Entities with unique IDs, explicit currency codes, and indexing.',
      files: ['Entities.kt'],
    },
    {
      name: 'com.musabbir.fintech.data.local.dao',
      desc: 'Reactive Flow DAO queries with zero cross-currency pollution.',
      files: ['FinTechDao.kt'],
    },
    {
      name: 'com.musabbir.fintech.data.repository',
      desc: 'Clean repository coordinating local persistence, domain mappings, and safe category reassignments.',
      files: ['FinTechRepository.kt'],
    },
    {
      name: 'com.musabbir.fintech.ui.components',
      desc: 'Jetpack Compose UI components: FinTechTopBar, CurrencyButton, and official AppFooter at scroll end.',
      files: ['CommonComponents.kt'],
    },
  ];

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-emerald-400" />
              Native Android Project Architecture
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Kotlin & Compose
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full source codebase located in <span className="font-mono text-emerald-300">/android</span> ready for Android Studio
          </p>
        </div>
      </div>

      {/* Hero Stack Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Code2 className="w-4 h-4 text-emerald-400" />
            UI Framework
          </div>
          <span className="text-base font-extrabold text-white block">Jetpack Compose</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Material 3, Edge-to-Edge, adjustResize IME
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-cyan-400" />
            Persistence
          </div>
          <span className="text-base font-extrabold text-white block">Room Database</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            SQLite with Coroutines Flow & TypeConverters
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Calculations
          </div>
          <span className="text-base font-extrabold text-white block">Minor Unit Math</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Integer fils & paise arithmetic (zero floats)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Data Isolation
          </div>
          <span className="text-base font-extrabold text-white block">100% Strict AED / INR</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Zero cross-currency mixing or exchange pollution
          </span>
        </div>
      </div>

      {/* Android Studio Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl mb-6">
        <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          How to Open & Build APK in Android Studio
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          The genuine native project is saved under <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300">/android</code> with Gradle Kotlin DSL:
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
            <div>
              <strong className="text-white block mb-0.5">1. Open Project in Android Studio:</strong>
              <p className="text-slate-400">Launch Android Studio &rarr; File &rarr; Open &rarr; Select the <span className="font-mono text-emerald-300">/android</span> directory.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
            <div>
              <strong className="text-white block mb-0.5">2. Build APK via Gradle Command Line:</strong>
              <code className="text-emerald-400 font-mono text-[11px] block mt-1">./gradlew assembleDebug</code>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('./gradlew assembleDebug', 'cmd1')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg shrink-0 flex items-center gap-1"
            >
              {copiedCmd === 'cmd1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[10px]">{copiedCmd === 'cmd1' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
            <div>
              <strong className="text-white block mb-0.5">3. Run Unit Tests (Logic First):</strong>
              <code className="text-emerald-400 font-mono text-[11px] block mt-1">./gradlew testDebugUnitTest</code>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('./gradlew testDebugUnitTest', 'cmd2')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg shrink-0 flex items-center gap-1"
            >
              {copiedCmd === 'cmd2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[10px]">{copiedCmd === 'cmd2' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Package Structure Detail */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl mb-8">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-emerald-400" />
          Native Source Code Packages
        </h2>
        <div className="space-y-3">
          {projectPackages.map(pkg => (
            <div key={pkg.name} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-400">{pkg.name}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  {pkg.files.length} file(s)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{pkg.desc}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {pkg.files.map(f => (
                  <span
                    key={f}
                    className="text-[11px] font-mono bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};
