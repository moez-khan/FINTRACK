import { requireAuth } from "@/lib/auth-utils";
import DashboardClient from "./DashboardClient";
import { prisma, executeWithRetry } from "@/lib/prisma-with-retry";

export default async function Dashboard() {
  const session = await requireAuth();
  
  // Fetch user with their data (with retry logic for Neon database)
  const user = await executeWithRetry(() => prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      selectedRule: true,
      currency: true,
      savingsPercentage: true,
      expenses: {
        orderBy: { date: 'desc' }
      },
      savingGoals: {
        orderBy: { deadline: 'asc' }
      }
    }
  }));

  if (!user) {
    throw new Error("User not found");
  }

  // Transform data for client component
  const dashboardData = {
    expenses: user.expenses.map(expense => ({
      ...expense,
      amount: expense.amount,
      type: expense.type as 'income' | 'expense',
      date: expense.date.toISOString(),
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
      notes: expense.notes || undefined
    })),
    savingGoals: user.savingGoals.map(goal => ({
      ...goal,
      deadline: goal.deadline.toISOString(),
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString()
    }))
  };

  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    selectedRule: user.selectedRule,
    savingsPercentage: user.savingsPercentage || 20,
    currency: user.currency || 'USD',
    rulePeriod: user.rulePeriod || 'monthly',
    customPeriodDays: user.customPeriodDays,
    periodStartDate: user.periodStartDate?.toISOString() || new Date().toISOString(),
    autoResetEnabled: user.autoResetEnabled !== false
  };

  return <DashboardClient user={userData} initialData={dashboardData} />;
}