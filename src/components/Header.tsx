/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Official Header component with prominent AED/INR switcher and period selector.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TimePeriod } from '../types';
import { 
  Calendar, 
  Bell, 
  Search, 
  X,
  TrendingUp
} from 'lucide-react';

const PERIOD_LABELS: Record<TimePeriod, string> = {
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
  THIS_WEEK: 'This Week',
  LAST_WEEK: 'Last Week',
  THIS_MONTH: 'This Month',
  LAST_MONTH: 'Last Month',
  THIS_YEAR: 'This Year',
  CUSTOM: 'Custom Range',
  ALL_TIME: 'All Time',
};

export const Header: React.FC<{
  onOpenReminders?: () => void;
  activeScreenTitle: string;
}> = ({ onOpenReminders, activeScreenTitle }) => {
  const {
    currency,
    setCurrency,
    period,
    setPeriod,
    customRange,
    setCustomRange,
    searchQuery,
    setSearchQuery,
    overdueRemindersCount,
    upcomingRemindersCount,
  } = useApp();

  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStart, setTempStart] = useState(customRange.start);
  const [tempEnd, setTempEnd] = useState(customRange.end);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const totalRemindersAlert = overdueRemindersCount + upcomingRemindersCount;

  const handleApplyCustomRange = () => {
    if (!tempStart || !tempEnd) {
      setRangeError('Both start date and end date are required.');
      return;
    }
    if (tempStart > tempEnd) {
      setRangeError('Start date cannot be after end date.');
      return;
    }
    setRangeError(null);
    setCustomRange({ start: tempStart, end: tempEnd });
    setPeriod('CUSTOM');
    setShowCustomModal(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full min-w-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 py-2.5 sm:py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-3">
        {/* Left side: Branding & Screen title */}
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-950/40 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                  {currency === 'AED' ? 'د.إ' : '₹'}
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">FinTech</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
                Dirham & Rupee Smart Expense Tracker
              </p>
            </div>
          </div>

          {/* Mobile Right: Reminders & Currency Switcher */}
          <div className="flex shrink-0 items-center gap-1 md:hidden">
            {/* Prominent Mobile Currency Switcher */}
            <div className="flex bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 shadow-inner">
              <button
                type="button"
                onClick={() => setCurrency('AED')}
                className={`px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-bold rounded-md transition-all ${
                  currency === 'AED'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to UAE Dirham (AED)"
                aria-label="Switch to AED currency"
              >
                AED (د.إ)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-bold rounded-md transition-all ${
                  currency === 'INR'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to Indian Rupee (INR)"
                aria-label="Switch to INR currency"
              >
                INR (₹)
              </button>
            </div>

            {/* Reminder Alert Badge */}
            {onOpenReminders && (
              <button
                type="button"
                onClick={onOpenReminders}
                className="relative p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                aria-label="View reminders"
              >
                <Bell className="w-4 h-4" />
                {totalRemindersAlert > 0 && (
                  <span
                    className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                      overdueRemindersCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Center / Right Controls: Search, Currency Switcher, Period Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Desktop Prominent Currency Switcher */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase tracking-wider">
              Currency
            </span>
            <button
              type="button"
              onClick={() => setCurrency('AED')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                currency === 'AED'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              aria-label="Switch to UAE Dirham"
            >
              <span>AED</span>
              <span className="text-[11px] opacity-80">(د.إ)</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrency('INR')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                currency === 'INR'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              aria-label="Switch to Indian Rupee"
            >
              <span>INR</span>
              <span className="text-[11px] opacity-80">(₹)</span>
            </button>
          </div>

          {/* Period Selector Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-xl border border-slate-700/70 transition-all shadow-sm max-w-[130px] sm:max-w-none truncate"
              aria-expanded={showPeriodDropdown}
              aria-label="Select reporting period"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{PERIOD_LABELS[period]}</span>
            </button>

            {showPeriodDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPeriodDropdown(false)}
                />
                <div 
                  className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs"
                  role="menu"
                >
                  {(Object.keys(PERIOD_LABELS) as TimePeriod[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        if (p === 'CUSTOM') {
                          setTempStart(customRange.start);
                          setTempEnd(customRange.end);
                          setRangeError(null);
                          setShowCustomModal(true);
                        } else {
                          setPeriod(p);
                        }
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between ${
                        period === p ? 'text-emerald-400 font-bold bg-slate-800/50' : 'text-slate-300'
                      }`}
                    >
                      <span>{PERIOD_LABELS[p]}</span>
                      {period === p && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Search Field */}
          <div className="relative flex-1 min-w-0 sm:w-44 md:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="w-full bg-slate-950/70 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 rounded-xl pl-8 pr-7 py-2 focus:outline-none focus:border-emerald-500 transition-colors"
              aria-label="Search records"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop Reminders Button */}
          {onOpenReminders && (
            <button
              type="button"
              onClick={onOpenReminders}
              className="hidden md:flex relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all shrink-0"
              aria-label="View reminders"
              title="Scheduled Reminders"
            >
              <Bell className="w-4 h-4" />
              {totalRemindersAlert > 0 && (
                <span
                  className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                    overdueRemindersCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Range Modal with Validation */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Select Custom Reporting Range
            </h3>

            {rangeError && (
              <div className="mb-3 p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                {rangeError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={e => {
                    setTempStart(e.target.value);
                    setRangeError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={e => {
                    setTempEnd(e.target.value);
                    setRangeError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowCustomModal(false);
                  setRangeError(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustomRange}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-sm"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
