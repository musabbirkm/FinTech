/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Official Application Name: FinTech
 * Product Description: FinTech — Dirham & Rupee Smart Expense Tracker
 * Lead Architect & Developer: Musabbir KM
 */

import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation, ScreenId } from './components/Navigation';

// Screens
import { DashboardScreen } from './screens/DashboardScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { IncomeScreen } from './screens/IncomeScreen';
import { DebtCreditScreen } from './screens/DebtCreditScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { RemindersScreen } from './screens/RemindersScreen';
import { BudgetsScreen } from './screens/BudgetsScreen';
import { ExportScreen } from './screens/ExportScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AndroidProjectScreen } from './screens/AndroidProjectScreen';

function MainApp() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');

  const screenTitles: Record<ScreenId, string> = {
    dashboard: 'Dashboard',
    income: 'Income Ledger',
    expenses: 'Expenses Ledger',
    debts: 'Debts & Credits',
    reports: 'Financial Analytics',
    reminders: 'Reminders & Notifications',
    budgets: 'Budgets & Goals',
    export: 'Excel & Data Export',
    settings: 'Settings & About',
    android: 'Native Android Code',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top App Header with Prominent AED/INR Switcher & Period Filter */}
      <Header
        activeScreenTitle={screenTitles[activeScreen]}
        onOpenReminders={() => setActiveScreen('reminders')}
      />

      {/* Main Responsive Layout: Sidebar on Desktop + Screen Content */}
      <div className="flex-1 flex w-full">
        {/* Navigation Component: Desktop Sidebar + Mobile Bottom Bar */}
        <Navigation
          activeScreen={activeScreen}
          onSelectScreen={setActiveScreen}
        />

        {/* Screen Content Scroll Area with mobile bottom padding to clear bottom bar */}
        <main className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-6 overflow-y-auto">
          {activeScreen === 'dashboard' && (
            <DashboardScreen onNavigate={setActiveScreen} />
          )}
          {activeScreen === 'income' && <IncomeScreen />}
          {activeScreen === 'expenses' && <ExpensesScreen />}
          {activeScreen === 'debts' && <DebtCreditScreen />}
          {activeScreen === 'reports' && <ReportsScreen />}
          {activeScreen === 'reminders' && <RemindersScreen />}
          {activeScreen === 'budgets' && <BudgetsScreen />}
          {activeScreen === 'export' && <ExportScreen />}
          {activeScreen === 'settings' && <SettingsScreen />}
          {activeScreen === 'android' && <AndroidProjectScreen />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
