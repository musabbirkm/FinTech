/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Responsive Navigation for Phone, Tablet, and Desktop.
 * Mobile compact bottom bar + Desktop sidebar.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  TrendingUp, 
  TrendingDown, 
  HandCoins, 
  BarChart3, 
  Menu, 
  X, 
  Bell, 
  Target, 
  Download, 
  Settings, 
  Smartphone,
  ChevronRight
} from 'lucide-react';

export type ScreenId = 
  | 'dashboard' 
  | 'income' 
  | 'expenses' 
  | 'debts' 
  | 'reports' 
  | 'reminders' 
  | 'budgets' 
  | 'export' 
  | 'settings' 
  | 'android';

interface NavigationProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeScreen,
  onSelectScreen,
}) => {
  const { overdueRemindersCount, upcomingRemindersCount } = useApp();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const totalReminders = overdueRemindersCount + upcomingRemindersCount;

  const mainNavItems = [
    { id: 'dashboard' as ScreenId, label: 'Dashboard', icon: Home },
    { id: 'income' as ScreenId, label: 'Income', icon: TrendingUp },
    { id: 'expenses' as ScreenId, label: 'Expenses', icon: TrendingDown },
    { id: 'debts' as ScreenId, label: 'Debts & Credits', icon: HandCoins },
    { id: 'reports' as ScreenId, label: 'Analytics', icon: BarChart3 },
  ];

  const secondaryNavItems = [
    { 
      id: 'reminders' as ScreenId, 
      label: 'Scheduled Reminders', 
      icon: Bell, 
      badge: totalReminders > 0 ? totalReminders : null,
      badgeColor: overdueRemindersCount > 0 ? 'bg-rose-500' : 'bg-amber-500'
    },
    { id: 'budgets' as ScreenId, label: 'Budgets & Goals', icon: Target },
    { id: 'export' as ScreenId, label: 'Excel & Backup', icon: Download },
    { id: 'android' as ScreenId, label: 'Native Android Code', icon: Smartphone, highlight: true },
    { id: 'settings' as ScreenId, label: 'Settings & About', icon: Settings },
  ];

  return (
    <>
      {/* DESKTOP / TABLET SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0 justify-between select-none">
        <div className="space-y-6">
          {/* Main items */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
              Core Ledgers
            </span>
            <nav className="space-y-1">
              {mainNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectScreen(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Secondary tools */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
              Financial Tools
            </span>
            <nav className="space-y-1">
              {secondaryNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectScreen(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : item.highlight
                        ? 'text-cyan-300 hover:bg-slate-800/60'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : item.highlight ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Developer Credit Mini Card */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            FinTech v1.0.0
          </p>
          <p className="text-xs font-semibold text-emerald-400 mt-0.5">
            Developed by Musabbir KM
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Dirham (د.إ) & Rupee (₹) isolated architecture
          </p>
        </div>
      </aside>

      {/* MOBILE COMPACT BOTTOM BAR */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl"
        aria-label="Mobile navigation"
      >
        {mainNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectScreen(item.id);
                setShowMoreMenu(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 absolute bottom-0" />
              )}
            </button>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
            showMoreMenu || ['reminders', 'budgets', 'export', 'settings', 'android'].includes(activeScreen)
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="More options"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">More</span>
          {totalReminders > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-2" />
          )}
        </button>
      </nav>

      {/* Mobile More Drawer */}
      {showMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-bold text-white">More Features & Tools</h3>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {secondaryNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectScreen(item.id);
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-emerald-400" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-medium">FinTech &copy; 2026 | Developed by Musabbir KM</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
