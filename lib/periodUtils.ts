import { addDays, addWeeks, addMonths, startOfWeek, startOfMonth, endOfWeek, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'custom';

export interface PeriodBounds {
  start: Date;
  end: Date;
  periodType: PeriodType;
  label: string;
}

export function getPeriodBounds(
  periodType: PeriodType,
  startDate: Date = new Date(),
  customDays?: number
): PeriodBounds {
  const date = new Date(startDate);
  
  switch (periodType) {
    case 'weekly':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }), // Monday start
        end: endOfWeek(date, { weekStartsOn: 1 }),
        periodType,
        label: `Week of ${startOfWeek(date, { weekStartsOn: 1 }).toLocaleDateString()}`
      };
      
    case 'monthly':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        periodType,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
      
    case 'quarterly':
      return {
        start: startOfQuarter(date),
        end: endOfQuarter(date),
        periodType,
        label: `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
      };
      
    case 'semi-annual':
      const halfYear = date.getMonth() < 6 ? 0 : 6;
      const halfYearStart = new Date(date.getFullYear(), halfYear, 1);
      const halfYearEnd = new Date(date.getFullYear(), halfYear + 5, 30, 23, 59, 59);
      return {
        start: halfYearStart,
        end: halfYearEnd,
        periodType,
        label: `${halfYear === 0 ? 'H1' : 'H2'} ${date.getFullYear()}`
      };
      
    case 'annual':
      return {
        start: startOfYear(date),
        end: endOfYear(date),
        periodType,
        label: `Year ${date.getFullYear()}`
      };
      
    case 'custom':
      if (!customDays || customDays <= 0) {
        throw new Error('Custom period requires valid customDays value');
      }
      const customEnd = addDays(date, customDays - 1);
      return {
        start: date,
        end: customEnd,
        periodType,
        label: `Custom ${customDays} days (${date.toLocaleDateString()} - ${customEnd.toLocaleDateString()})`
      };
      
    default:
      throw new Error(`Invalid period type: ${periodType}`);
  }
}

export function getNextPeriodStart(periodType: PeriodType, currentEnd: Date, customDays?: number): Date {
  const nextDay = addDays(currentEnd, 1);
  
  switch (periodType) {
    case 'weekly':
      return startOfWeek(nextDay, { weekStartsOn: 1 });
    case 'monthly':
      return startOfMonth(addMonths(currentEnd, 1));
    case 'quarterly':
      return startOfQuarter(addMonths(currentEnd, 1));
    case 'semi-annual':
      return addMonths(currentEnd, 6);
    case 'annual':
      return startOfYear(addDays(currentEnd, 1));
    case 'custom':
      return nextDay;
    default:
      return nextDay;
  }
}

export function isPeriodComplete(periodEnd: Date): boolean {
  return new Date() > periodEnd;
}

export function getDaysRemaining(periodEnd: Date): number {
  const now = new Date();
  const diff = periodEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getProgressPercentage(periodStart: Date, periodEnd: Date): number {
  const now = new Date();
  const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  
  return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
}

export function formatPeriodLabel(periodType: PeriodType, startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  switch (periodType) {
    case 'weekly':
      return `Week: ${start} - ${end}`;
    case 'monthly':
      return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'quarterly':
      return `Q${Math.floor(startDate.getMonth() / 3) + 1} ${startDate.getFullYear()}`;
    case 'semi-annual':
      return `${startDate.getMonth() < 6 ? 'H1' : 'H2'} ${startDate.getFullYear()}`;
    case 'annual':
      return `${startDate.getFullYear()}`;
    case 'custom':
      return `${start} - ${end}`;
    default:
      return `${start} - ${end}`;
  }
}

export const PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly', description: 'Reset every week (Monday to Sunday)' },
  { value: 'monthly', label: 'Monthly', description: 'Reset at the beginning of each month' },
  { value: 'quarterly', label: 'Quarterly', description: 'Reset every 3 months' },
  { value: 'semi-annual', label: 'Semi-Annual', description: 'Reset every 6 months' },
  { value: 'annual', label: 'Annual', description: 'Reset once a year' },
  { value: 'custom', label: 'Custom', description: 'Set your own period length' }
];