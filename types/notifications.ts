// Type definitions for notifications

export interface BillReminder {
  id: string;
  userId: string;
  name: string;
  amount?: number | null;
  dueDate: Date;
  frequency: string;
  reminderDays: number[];
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  period: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  type: string;
  category: string;
  date: Date;
  notes?: string | null;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingGoal {
  id: string;
  userId: string;
  name: string;
  target: number;
  saved: number;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetStatus {
  spent: number;
  budget: number;
}

export interface NotificationData {
  [key: string]: unknown;
  category?: string;
  budgetAmount?: number;
  period?: string;
  action?: string;
  billId?: string;
  billName?: string;
  amount?: number;
  dueDate?: Date;
  frequency?: string;
  goalId?: string;
  goalName?: string;
  targetAmount?: number;
  currentAmount?: number;
  expenseId?: string;
  description?: string;
  budgetPercentage?: string | null;
}