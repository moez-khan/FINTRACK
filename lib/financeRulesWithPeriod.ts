import { Expense, SavingGoal } from '@prisma/client';
import { getPeriodBounds, PeriodType } from './periodUtils';

// Expense category mappings
const NEEDS_CATEGORIES = ['groceries', 'rent', 'transport', 'utilities', 'insurance', 'healthcare', 'bills'];
const WANTS_CATEGORIES = ['shopping', 'entertainment', 'dining', 'hobbies', 'travel', 'subscriptions'];
const SAVINGS_CATEGORIES = ['savings', 'investment', 'retirement', 'emergency fund'];

function categorizeExpense(category: string): 'needs' | 'wants' | 'savings' {
  const lowerCategory = category.toLowerCase();
  
  if (NEEDS_CATEGORIES.some(need => lowerCategory.includes(need))) {
    return 'needs';
  }
  if (WANTS_CATEGORIES.some(want => lowerCategory.includes(want))) {
    return 'wants';
  }
  if (SAVINGS_CATEGORIES.some(saving => lowerCategory.includes(saving))) {
    return 'savings';
  }
  
  return 'wants';
}

// Filter expenses by period
export function filterExpensesByPeriod(
  expenses: Expense[], 
  periodType: PeriodType,
  periodStartDate: Date,
  customDays?: number
): Expense[] {
  const bounds = getPeriodBounds(periodType, periodStartDate, customDays);
  
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= bounds.start && expenseDate <= bounds.end;
  });
}

// Calculate income for a specific period
export function calculatePeriodIncome(
  expenses: Expense[],
  periodType: PeriodType,
  periodStartDate: Date,
  customDays?: number
): number {
  const periodExpenses = filterExpensesByPeriod(expenses, periodType, periodStartDate, customDays);
  
  return periodExpenses
    .filter(e => e.type === 'income')
    .reduce((sum, income) => sum + income.amount, 0);
}

// Calculate 50-30-20 rule for a specific period
export function calculate50_30_20ForPeriod(
  expenses: Expense[],
  periodType: PeriodType,
  periodStartDate: Date,
  customDays?: number
) {
  const periodExpenses = filterExpensesByPeriod(expenses, periodType, periodStartDate, customDays);
  const periodIncome = calculatePeriodIncome(expenses, periodType, periodStartDate, customDays);
  
  // Calculate allocations based on period income
  const allocations = {
    needs: periodIncome * 0.5,
    wants: periodIncome * 0.3,
    savings: periodIncome * 0.2
  };
  
  // Calculate actual spending in period
  const spending = {
    needs: 0,
    wants: 0,
    savings: 0
  };
  
  // Only consider expenses (not income) for spending calculation
  const actualExpenses = periodExpenses.filter(e => e.type === 'expense');
  
  actualExpenses.forEach(expense => {
    const category = categorizeExpense(expense.category);
    spending[category] += expense.amount;
  });
  
  // Calculate remaining amounts
  const remaining = {
    needs: Math.max(0, allocations.needs - spending.needs),
    wants: Math.max(0, allocations.wants - spending.wants),
    savings: Math.max(0, allocations.savings - spending.savings)
  };
  
  // Calculate percentages used
  const percentages = {
    needs: allocations.needs > 0 ? (spending.needs / allocations.needs) * 100 : 0,
    wants: allocations.wants > 0 ? (spending.wants / allocations.wants) * 100 : 0,
    savings: allocations.savings > 0 ? (spending.savings / allocations.savings) * 100 : 0
  };
  
  const bounds = getPeriodBounds(periodType, periodStartDate, customDays);
  
  return {
    period: {
      type: periodType,
      start: bounds.start,
      end: bounds.end,
      label: bounds.label
    },
    allocations,
    spending,
    remaining,
    percentages,
    totalBudget: periodIncome,
    totalSpent: spending.needs + spending.wants + spending.savings,
    isOverBudget: {
      needs: spending.needs > allocations.needs,
      wants: spending.wants > allocations.wants,
      savings: false
    },
    periodProgress: getProgress(bounds.start, bounds.end)
  };
}

// Calculate Pay Yourself First for a specific period
export function calculatePayYourselfFirstForPeriod(
  expenses: Expense[],
  percentage: number,
  periodType: PeriodType,
  periodStartDate: Date,
  customDays?: number
) {
  const periodExpenses = filterExpensesByPeriod(expenses, periodType, periodStartDate, customDays);
  const periodIncome = calculatePeriodIncome(expenses, periodType, periodStartDate, customDays);
  const savingsPercentage = percentage / 100;
  
  // Calculate savings allocation for period
  const savingsAllocation = periodIncome * savingsPercentage;
  const availableForExpenses = periodIncome - savingsAllocation;
  
  // Calculate actual expenses in period (excluding savings)
  const actualExpenses = periodExpenses.filter(e => 
    e.type === 'expense' && 
    !SAVINGS_CATEGORIES.some(cat => e.category.toLowerCase().includes(cat))
  );
  
  const totalExpenses = actualExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate actual savings in period
  const savingsTransactions = periodExpenses.filter(e => 
    e.type === 'expense' && 
    SAVINGS_CATEGORIES.some(cat => e.category.toLowerCase().includes(cat))
  );
  
  const actualSavings = savingsTransactions.reduce((sum, expense) => sum + expense.amount, 0);
  
  const bounds = getPeriodBounds(periodType, periodStartDate, customDays);
  
  return {
    period: {
      type: periodType,
      start: bounds.start,
      end: bounds.end,
      label: bounds.label
    },
    periodIncome,
    savingsPercentage: percentage,
    savingsTarget: savingsAllocation,
    actualSavings,
    savingsProgress: savingsAllocation > 0 ? (actualSavings / savingsAllocation) * 100 : 0,
    availableForExpenses,
    totalExpenses,
    remainingBudget: availableForExpenses - totalExpenses,
    isOnTrack: actualSavings >= savingsAllocation,
    savingsGap: Math.max(0, savingsAllocation - actualSavings),
    expensesOverBudget: totalExpenses > availableForExpenses,
    periodProgress: getProgress(bounds.start, bounds.end)
  };
}

// Get expense breakdown by category for period
export function getExpenseBreakdownForPeriod(
  expenses: Expense[],
  periodType: PeriodType,
  periodStartDate: Date,
  customDays?: number
) {
  const periodExpenses = filterExpensesByPeriod(expenses, periodType, periodStartDate, customDays);
  const breakdown: Record<string, number> = {};
  
  periodExpenses
    .filter(e => e.type === 'expense')
    .forEach(expense => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = 0;
      }
      breakdown[expense.category] += expense.amount;
    });
  
  const bounds = getPeriodBounds(periodType, periodStartDate, customDays);
  
  return {
    period: {
      type: periodType,
      start: bounds.start,
      end: bounds.end,
      label: bounds.label
    },
    breakdown,
    total: Object.values(breakdown).reduce((sum, amount) => sum + amount, 0)
  };
}

// Helper function to get period progress
function getProgress(start: Date, end: Date): number {
  const now = new Date();
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  if (now > end) return 100;
  if (now < start) return 0;
  
  return Math.round((elapsed / total) * 100);
}

// Get historical periods for comparison
export function getHistoricalPeriods(
  periodType: PeriodType,
  lookbackCount: number = 6
): Array<{ start: Date; end: Date; label: string }> {
  const periods = [];
  const now = new Date();
  
  for (let i = 0; i < lookbackCount; i++) {
    let periodStart: Date;
    
    switch (periodType) {
      case 'weekly':
        periodStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        break;
      case 'quarterly':
        periodStart = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
        break;
      case 'semi-annual':
        periodStart = new Date(now.getFullYear(), now.getMonth() - (i * 6), 1);
        break;
      case 'annual':
        periodStart = new Date(now.getFullYear() - i, 0, 1);
        break;
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    }
    
    const bounds = getPeriodBounds(periodType, periodStart);
    periods.push({
      start: bounds.start,
      end: bounds.end,
      label: bounds.label
    });
  }
  
  return periods.reverse();
}