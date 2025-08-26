import { Expense, SavingGoal } from '@prisma/client';

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
  
  // Default to wants if uncategorized
  return 'wants';
}

export function calculate50_30_20(income: number, expenses: Expense[]) {
  const monthlyIncome = income;
  
  // Calculate allocations
  const allocations = {
    needs: monthlyIncome * 0.5,
    wants: monthlyIncome * 0.3,
    savings: monthlyIncome * 0.2
  };
  
  // Calculate actual spending
  const spending = {
    needs: 0,
    wants: 0,
    savings: 0
  };
  
  // Only consider expenses (not income) for spending calculation
  const actualExpenses = expenses.filter(e => e.type === 'expense');
  
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
  
  return {
    allocations,
    spending,
    remaining,
    percentages,
    totalBudget: monthlyIncome,
    totalSpent: spending.needs + spending.wants + spending.savings,
    isOverBudget: {
      needs: spending.needs > allocations.needs,
      wants: spending.wants > allocations.wants,
      savings: false // Savings can't be "over" budget
    }
  };
}

export function calculatePayYourselfFirst(income: number, percentage: number, expenses: Expense[]) {
  const monthlyIncome = income;
  const savingsPercentage = percentage / 100; // Convert to decimal
  
  // Calculate savings allocation
  const savingsAllocation = monthlyIncome * savingsPercentage;
  const availableForExpenses = monthlyIncome - savingsAllocation;
  
  // Calculate actual expenses (excluding savings)
  const actualExpenses = expenses.filter(e => 
    e.type === 'expense' && 
    !SAVINGS_CATEGORIES.some(cat => e.category.toLowerCase().includes(cat))
  );
  
  const totalExpenses = actualExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate actual savings
  const savingsTransactions = expenses.filter(e => 
    e.type === 'expense' && 
    SAVINGS_CATEGORIES.some(cat => e.category.toLowerCase().includes(cat))
  );
  
  const actualSavings = savingsTransactions.reduce((sum, expense) => sum + expense.amount, 0);
  
  return {
    monthlyIncome,
    savingsPercentage: percentage,
    savingsTarget: savingsAllocation,
    actualSavings,
    savingsProgress: savingsAllocation > 0 ? (actualSavings / savingsAllocation) * 100 : 0,
    availableForExpenses,
    totalExpenses,
    remainingBudget: availableForExpenses - totalExpenses,
    isOnTrack: actualSavings >= savingsAllocation,
    savingsGap: Math.max(0, savingsAllocation - actualSavings),
    expensesOverBudget: totalExpenses > availableForExpenses
  };
}

export function calculateSmartGoal(goal: SavingGoal, currentSavings: number, monthlyIncome: number) {
  const now = new Date();
  const deadline = new Date(goal.deadline);
  
  // Calculate months until deadline
  const monthsRemaining = Math.max(0, 
    (deadline.getFullYear() - now.getFullYear()) * 12 + 
    (deadline.getMonth() - now.getMonth())
  );
  
  // Calculate required monthly saving
  const amountRemaining = Math.max(0, goal.target - goal.saved);
  const requiredMonthlySaving = monthsRemaining > 0 ? amountRemaining / monthsRemaining : amountRemaining;
  
  // Calculate current pace (based on how much saved so far)
  const daysSinceCreation = Math.max(1, 
    Math.floor((now.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );
  const currentDailyPace = goal.saved / daysSinceCreation;
  const currentMonthlyPace = currentDailyPace * 30;
  
  // Calculate months to reach goal at current pace
  let monthsToGoal = 0;
  if (currentMonthlyPace > 0) {
    monthsToGoal = Math.ceil(amountRemaining / currentMonthlyPace);
  }
  
  // Determine if on track
  const isOnTrack = currentMonthlyPace >= requiredMonthlySaving;
  
  // Calculate progress percentage
  const progressPercentage = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
  
  // Generate forecast message
  let forecastMessage = '';
  if (goal.saved >= goal.target) {
    forecastMessage = '🎉 Goal achieved!';
  } else if (monthsRemaining === 0) {
    forecastMessage = '⚠️ Deadline has passed';
  } else if (currentMonthlyPace === 0) {
    forecastMessage = `💡 You need to save $${requiredMonthlySaving.toFixed(2)}/month to reach your goal`;
  } else if (isOnTrack) {
    forecastMessage = `✅ On track! At this pace, you'll reach your goal in ${monthsToGoal} months`;
  } else {
    const additionalNeeded = requiredMonthlySaving - currentMonthlyPace;
    forecastMessage = `⚠️ You need to save an additional $${additionalNeeded.toFixed(2)}/month to meet your deadline`;
  }
  
  // Calculate affordability based on income
  const savingsAsPercentOfIncome = monthlyIncome > 0 ? (requiredMonthlySaving / monthlyIncome) * 100 : 0;
  const isAffordable = savingsAsPercentOfIncome <= 30; // Consider affordable if <= 30% of income
  
  return {
    goalName: goal.name,
    target: goal.target,
    saved: goal.saved,
    remaining: amountRemaining,
    progressPercentage,
    deadline: goal.deadline,
    monthsRemaining,
    requiredMonthlySaving,
    currentMonthlyPace,
    monthsToGoal,
    isOnTrack,
    forecastMessage,
    savingsAsPercentOfIncome,
    isAffordable,
    daysUntilDeadline: Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  };
}

// Helper function to get all SMART goals calculations
export function calculateAllSmartGoals(goals: SavingGoal[], monthlyIncome: number) {
  return goals.map(goal => calculateSmartGoal(goal, goal.saved, monthlyIncome));
}

// Helper function to get expense breakdown by category
export function getExpenseBreakdown(expenses: Expense[]) {
  const breakdown: Record<string, number> = {};
  
  expenses
    .filter(e => e.type === 'expense')
    .forEach(expense => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = 0;
      }
      breakdown[expense.category] += expense.amount;
    });
  
  return breakdown;
}

// Helper function to get monthly income from transactions
export function calculateMonthlyIncome(expenses: Expense[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyIncome = expenses
    .filter(e => 
      e.type === 'income' && 
      new Date(e.date) >= startOfMonth
    )
    .reduce((sum, income) => sum + income.amount, 0);
  
  return monthlyIncome;
}