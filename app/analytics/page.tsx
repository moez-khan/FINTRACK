import { requireAuth } from "@/lib/auth-utils";
import AnalyticsClient from './AnalyticsClient';
import { prisma, executeWithRetry } from "@/lib/prisma-with-retry";

export default async function AnalyticsPage() {
  const session = await requireAuth();

  // Get user data
  const user = await executeWithRetry(() => prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      expenses: {
        orderBy: { date: 'desc' }
      },
      savingGoals: true
    }
  }));

  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    selectedRule: user.selectedRule,
    savingsPercentage: user.savingsPercentage || 20,
    currency: user.currency || 'USD'
  };

  const initialData = {
    expenses: user.expenses.map(expense => ({
      ...expense,
      type: expense.type as 'income' | 'expense',
      date: expense.date.toISOString(),
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString()
    })),
    savingGoals: user.savingGoals.map(goal => ({
      ...goal,
      deadline: goal.deadline.toISOString(),
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString()
    }))
  };

  return <AnalyticsClient user={userData} initialData={initialData} />;
}