/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Official application footer and developer credit.
 * Displayed naturally at the bottom of the scrollable main content.
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-12 mb-8 pt-8 pb-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium tracking-wide">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>FinTech — Dirham & Rupee Smart Expense Tracker</span>
        </div>
        <p className="text-slate-400 font-semibold text-xs">
          FinTech &copy; 2026 | Developed by Musabbir KM
        </p>
        <p className="text-slate-400 font-medium text-xs flex flex-wrap items-center justify-center gap-1.5">
          <span>A Zavyani product</span>
          <span className="text-slate-600">|</span>
          <a
            href="https://zavyani.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
          >
            zavyani.xyz
          </a>
          <span className="text-slate-600">|</span>
          <a
            href="mailto:zavyani@zavyani.xyz"
            className="text-slate-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
          >
            zavyani@zavyani.xyz
          </a>
        </p>
        <p className="text-[11px] text-slate-500 max-w-md">
          Zero cross-currency distortion. 100% offline, privacy-first local storage for AED (fils) and INR (paise).
        </p>
      </div>
    </footer>
  );
};
