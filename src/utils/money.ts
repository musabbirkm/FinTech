/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Financial calculation utilities in integer minor units (fils/paise).
 * Strict AED and INR currency isolation.
 */

import { Currency, DebtRecord, RepaymentRecord, TimePeriod } from '../types';

export const CURRENCY_CONFIG: Record<Currency, {
  code: Currency;
  name: string;
  symbol: string;
  nativeSymbol: string;
  minorUnitName: string;
  minorUnitsPerMajor: number;
  decimals: number;
}> = {
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    nativeSymbol: 'د.إ',
    minorUnitName: 'fils',
    minorUnitsPerMajor: 100,
    decimals: 2,
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    nativeSymbol: '₹',
    minorUnitName: 'paise',
    minorUnitsPerMajor: 100,
    decimals: 2,
  },
};

/**
 * Convert major currency amount string or number to integer minor units (fils or paise).
 * Uses robust string splitting to prevent floating point inaccuracies.
 */
export function toMinorUnits(majorAmount: number | string, currency: Currency): number {
  if (typeof majorAmount === 'number' && (!Number.isFinite(majorAmount) || isNaN(majorAmount))) {
    return 0;
  }

  const cleanStr = String(majorAmount).trim().replace(/,/g, '');
  if (!cleanStr) return 0;

  const config = CURRENCY_CONFIG[currency];
  const parts = cleanStr.split('.');
  const wholePart = parts[0] || '0';
  let fracPart = parts[1] || '';

  // Pad or slice fractional part to decimals length (2 for AED and INR)
  fracPart = fracPart.padEnd(config.decimals, '0').slice(0, config.decimals);

  const sign = wholePart.startsWith('-') ? -1 : 1;
  const absWhole = wholePart.replace('-', '');

  const totalMinor = parseInt(absWhole || '0', 10) * config.minorUnitsPerMajor + parseInt(fracPart || '0', 10);
  return sign * totalMinor;
}

/**
 * Convert integer minor units back to major units float (only for display/rendering).
 */
export function toMajorUnits(minorAmount: number, currency: Currency): number {
  if (!Number.isFinite(minorAmount) || isNaN(minorAmount)) return 0;
  const config = CURRENCY_CONFIG[currency];
  return minorAmount / config.minorUnitsPerMajor;
}

/**
 * Format minor units into clean localized currency display.
 */
export function formatMoney(
  minorAmount: number,
  currency: Currency,
  options?: { showSymbol?: boolean; useNativeSymbol?: boolean; hideDecimalsIfZero?: boolean }
): string {
  if (!Number.isFinite(minorAmount) || isNaN(minorAmount)) {
    minorAmount = 0;
  }

  const config = CURRENCY_CONFIG[currency];
  const isNegative = minorAmount < 0;
  const absMinor = Math.abs(minorAmount);

  const whole = Math.floor(absMinor / config.minorUnitsPerMajor);
  const frac = absMinor % config.minorUnitsPerMajor;

  let formattedWhole: string;

  if (currency === 'INR') {
    // Format with Indian number system (Lakhs, Crores): e.g. 12,34,567
    formattedWhole = formatIndianNumber(whole);
  } else {
    // Standard international 3-digit comma separation: e.g. 1,234,567
    formattedWhole = whole.toLocaleString('en-US');
  }

  const fracStr = frac.toString().padStart(config.decimals, '0');
  const numberStr = options?.hideDecimalsIfZero && frac === 0 
    ? formattedWhole 
    : `${formattedWhole}.${fracStr}`;

  const signedNumberStr = isNegative ? `-${numberStr}` : numberStr;

  if (options?.showSymbol === false) {
    return signedNumberStr;
  }

  const symbol = options?.useNativeSymbol ? config.nativeSymbol : config.symbol;
  return `${symbol} ${signedNumberStr}`;
}

/**
 * Indian numbering system formatting: 1,00,000 for one lakh
 */
function formatIndianNumber(x: number): string {
  const s = x.toString();
  if (s.length <= 3) return s;
  
  const lastThree = s.substring(s.length - 3);
  const otherNumbers = s.substring(0, s.length - 3);
  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${formattedOther},${lastThree}`;
}

/**
 * Calculate outstanding debt or receivable balance:
 * Outstanding = originalPrincipalMinor - sum(validRepaymentsMinor)
 */
export function calculateOutstandingDebt(
  debt: DebtRecord,
  repayments: RepaymentRecord[]
): {
  repaidMinor: number;
  outstandingMinor: number;
  percentageRepaid: number;
  isFullyPaid: boolean;
} {
  const debtRepayments = repayments.filter(r => r.debtId === debt.id && r.currency === debt.currency);
  const repaidMinor = debtRepayments.reduce((sum, r) => sum + r.amountMinor, 0);
  const outstandingMinor = Math.max(0, debt.originalAmountMinor - repaidMinor);
  const percentageRepaid = debt.originalAmountMinor > 0 
    ? Math.min(100, Math.round((repaidMinor / debt.originalAmountMinor) * 100)) 
    : 100;
  
  return {
    repaidMinor,
    outstandingMinor,
    percentageRepaid,
    isFullyPaid: outstandingMinor === 0,
  };
}

/**
 * Calculate start and end date for standard reporting periods.
 */
export function getPeriodDateRange(period: TimePeriod, customRange?: { start: string; end: string }): {
  startDate: string; // ISO YYYY-MM-DD
  endDate: string; // ISO YYYY-MM-DD
} {
  const now = new Date();
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYMD(now);

  switch (period) {
    case 'TODAY':
      return { startDate: todayStr, endDate: todayStr };

    case 'YESTERDAY': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatYMD(y);
      return { startDate: yStr, endDate: yStr };
    }

    case 'THIS_WEEK': {
      const d = new Date(now);
      const day = d.getDay(); // 0 is Sunday
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      const monday = new Date(d.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { startDate: formatYMD(monday), endDate: formatYMD(sunday) };
    }

    case 'LAST_WEEK': {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day - 6;
      const lastMonday = new Date(d.setDate(diff));
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      return { startDate: formatYMD(lastMonday), endDate: formatYMD(lastSunday) };
    }

    case 'THIS_MONTH': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: formatYMD(firstDay), endDate: formatYMD(lastDay) };
    }

    case 'LAST_MONTH': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: formatYMD(firstDay), endDate: formatYMD(lastDay) };
    }

    case 'THIS_YEAR': {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      return { startDate: formatYMD(firstDay), endDate: formatYMD(lastDay) };
    }

    case 'CUSTOM':
      return {
        startDate: customRange?.start || '1970-01-01',
        endDate: customRange?.end || todayStr,
      };

    case 'ALL_TIME':
    default:
      return { startDate: '1970-01-01', endDate: '2099-12-31' };
  }
}

/**
 * Filter items by date range and currency strictly.
 */
export function isWithinDateRange(dateStr: string, startDate: string, endDate: string): boolean {
  return dateStr >= startDate && dateStr <= endDate;
}
