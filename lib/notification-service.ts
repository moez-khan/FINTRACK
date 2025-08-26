import { PrismaClient } from '@prisma/client';
import type { BillReminder, Budget, Expense, SavingGoal, BudgetStatus, NotificationData as TypedNotificationData } from '@/types/notifications';

const prisma = new PrismaClient();

export interface NotificationData {
  type: 'budget_alert' | 'bill_reminder' | 'goal_milestone' | 'anomaly' | 'summary';
  title: string;
  message: string;
  data?: TypedNotificationData;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export class NotificationService {
  static async createNotification(userId: string, notification: NotificationData) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data as any || undefined,
          priority: notification.priority || 'normal'
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async checkBudgetAlerts(userId: string) {
    try {
      // Get user's budgets and current spending
      const budgets = await prisma.budget.findMany({
        where: { userId }
      });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      for (const budget of budgets) {
        // Calculate current spending for this category
        const expenses = await prisma.expense.findMany({
          where: {
            userId,
            category: budget.category,
            date: {
              gte: startOfMonth,
              lte: now
            }
          }
        });

        const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const percentage = (totalSpent / budget.amount) * 100;

        // Check if we need to send alerts
        let alertLevel: 'warning' | 'critical' | null = null;
        let message = '';

        if (percentage >= 100) {
          alertLevel = 'critical';
          message = `You've exceeded your ${budget.category} budget by $${(totalSpent - budget.amount).toFixed(2)}!`;
        } else if (percentage >= 90) {
          alertLevel = 'critical';
          message = `You're at ${percentage.toFixed(0)}% of your ${budget.category} budget. Only $${(budget.amount - totalSpent).toFixed(2)} remaining!`;
        } else if (percentage >= 75) {
          alertLevel = 'warning';
          message = `You've used ${percentage.toFixed(0)}% of your ${budget.category} budget. $${(budget.amount - totalSpent).toFixed(2)} remaining.`;
        }

        if (alertLevel) {
          // Check if we already sent this alert recently (within 24 hours)
          const recentAlert = await prisma.notification.findFirst({
            where: {
              userId,
              type: 'budget_alert',
              data: {
                path: ['category'],
                equals: budget.category
              },
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }
          });

          if (!recentAlert) {
            await this.createNotification(userId, {
              type: 'budget_alert',
              title: `${budget.category} Budget Alert`,
              message,
              data: {
                category: budget.category,
                budgetAmount: budget.amount,
                currentSpending: totalSpent,
                percentage: percentage.toFixed(1)
              },
              priority: alertLevel === 'critical' ? 'critical' : 'high'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  }

  static async checkGoalMilestones(userId: string) {
    try {
      const goals = await prisma.savingGoal.findMany({
        where: { userId }
      });

      for (const goal of goals) {
        const percentage = (goal.saved / goal.target) * 100;
        const milestones = [25, 50, 75, 100];

        for (const milestone of milestones) {
          if (percentage >= milestone) {
            // Check if we already celebrated this milestone
            const existingMilestone = await prisma.notification.findFirst({
              where: {
                userId,
                type: 'goal_milestone',
                data: {
                  path: ['goalId'],
                  equals: goal.id
                },
                message: {
                  contains: `${milestone}%`
                }
              }
            });

            if (!existingMilestone) {
              let message = '';
              let celebrationLevel = 'normal';

              if (milestone === 100) {
                message = `🎉 Congratulations! You've reached your "${goal.name}" goal of $${goal.target}!`;
                celebrationLevel = 'high';
              } else {
                message = `🎯 Great progress! You've reached ${milestone}% of your "${goal.name}" goal!`;
              }

              await this.createNotification(userId, {
                type: 'goal_milestone',
                title: 'Goal Milestone Reached!',
                message,
                data: {
                  goalId: goal.id,
                  goalName: goal.name,
                  milestone,
                  currentAmount: goal.saved,
                  targetAmount: goal.target
                },
                priority: celebrationLevel as 'low' | 'normal' | 'high' | 'critical'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking goal milestones:', error);
    }
  }

  static async checkBillReminders() {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + 7); // Check for bills due in next 7 days

      const upcomingBills = await prisma.billReminder.findMany({
        where: {
          dueDate: {
            gte: now,
            lte: futureDate
          },
          isPaid: false
        }
      });

      for (const bill of upcomingBills) {
        const daysUntilDue = Math.ceil((bill.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (bill.reminderDays.includes(daysUntilDue)) {
          // Check if we already sent this reminder
          const existingReminder = await prisma.notification.findFirst({
            where: {
              userId: bill.userId,
              type: 'bill_reminder',
              data: {
                path: ['billId'],
                equals: bill.id
              },
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
              }
            }
          });

          if (!existingReminder) {
            let urgency = 'normal';
            if (daysUntilDue <= 1) urgency = 'high';
            else if (daysUntilDue <= 3) urgency = 'normal';

            const message = daysUntilDue === 0 
              ? `💳 "${bill.name}" is due today${bill.amount ? ` ($${bill.amount})` : ''}!`
              : `💳 "${bill.name}" is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}${bill.amount ? ` ($${bill.amount})` : ''}.`;

            await this.createNotification(bill.userId, {
              type: 'bill_reminder',
              title: 'Bill Reminder',
              message,
              data: {
                billId: bill.id,
                billName: bill.name,
                amount: bill.amount ?? undefined,
                dueDate: bill.dueDate,
                daysUntilDue
              },
              priority: urgency as 'low' | 'normal' | 'high' | 'critical'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking bill reminders:', error);
    }
  }

  static async detectSpendingAnomalies(userId: string) {
    try {
      const now = new Date();
      const last30Days = new Date();
      last30Days.setDate(now.getDate() - 30);

      // Get recent expenses
      const recentExpenses = await prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: last30Days
          }
        },
        orderBy: { date: 'desc' }
      });

      if (recentExpenses.length < 10) return; // Need enough data

      // Calculate average spending
      const totalSpending = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const averageExpense = totalSpending / recentExpenses.length;
      const standardDeviation = Math.sqrt(
        recentExpenses.reduce((sum, expense) => 
          sum + Math.pow(expense.amount - averageExpense, 2), 0
        ) / recentExpenses.length
      );

      // Check for anomalies (expenses > 2 standard deviations above average)
      const anomalyThreshold = averageExpense + (2 * standardDeviation);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysLargeExpenses = recentExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        expenseDate.setHours(0, 0, 0, 0);
        return expenseDate.getTime() === today.getTime() && expense.amount > anomalyThreshold;
      });

      for (const expense of todaysLargeExpenses) {
        // Check if we already alerted about this expense
        const existingAlert = await prisma.notification.findFirst({
          where: {
            userId,
            type: 'anomaly',
            data: {
              path: ['expenseId'],
              equals: expense.id
            }
          }
        });

        if (!existingAlert) {
          const percentageAboveAverage = ((expense.amount - averageExpense) / averageExpense * 100).toFixed(0);
          
          await this.createNotification(userId, {
            type: 'anomaly',
            title: 'Unusual Spending Detected',
            message: `🚨 Large expense detected: $${expense.amount} for ${expense.category}. This is ${percentageAboveAverage}% above your average spending.`,
            data: {
              expenseId: expense.id,
              amount: expense.amount,
              category: expense.category,
              averageSpending: averageExpense.toFixed(2),
              percentageAboveAverage
            },
            priority: 'high'
          });
        }
      }
    } catch (error) {
      console.error('Error detecting spending anomalies:', error);
    }
  }

  static async runAllChecks(userId: string) {
    await Promise.all([
      this.checkBudgetAlerts(userId),
      this.checkGoalMilestones(userId),
      this.detectSpendingAnomalies(userId)
    ]);
  }

  static async runGlobalChecks() {
    await this.checkBillReminders();
  }

  // Immediate notification methods for user actions
  static async notifyBillReminderCreated(userId: string, billReminder: BillReminder) {
    try {
      const reminderDaysText = billReminder.reminderDays.join(', ');
      const amountText = billReminder.amount ? ` for $${billReminder.amount}` : '';
      
      await this.createNotification(userId, {
        type: 'bill_reminder',
        title: '✅ Bill Reminder Created',
        message: `Successfully set up reminder for "${billReminder.name}"${amountText}. You'll be notified ${reminderDaysText} days before the due date.`,
        data: {
          billId: billReminder.id,
          billName: billReminder.name,
          amount: billReminder.amount ?? undefined,
          dueDate: billReminder.dueDate,
          frequency: billReminder.frequency,
          action: 'created'
        },
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error creating bill reminder notification:', error);
    }
  }

  static async notifyBillReminderUpdated(userId: string, billReminder: BillReminder) {
    try {
      const amountText = billReminder.amount ? ` ($${billReminder.amount})` : '';
      
      await this.createNotification(userId, {
        type: 'bill_reminder',
        title: '📝 Bill Reminder Updated',
        message: `"${billReminder.name}"${amountText} has been updated successfully.`,
        data: {
          billId: billReminder.id,
          billName: billReminder.name,
          amount: billReminder.amount ?? undefined,
          action: 'updated'
        },
        priority: 'low'
      });
    } catch (error) {
      console.error('Error creating bill reminder update notification:', error);
    }
  }

  static async notifyBudgetCreated(userId: string, budget: Budget) {
    try {
      await this.createNotification(userId, {
        type: 'budget_alert',
        title: '💰 Budget Created',
        message: `Your ${budget.period} budget of $${budget.amount} for ${budget.category} has been set successfully. We'll alert you when spending approaches this limit.`,
        data: {
          category: budget.category,
          budgetAmount: budget.amount,
          period: budget.period,
          action: 'created'
        },
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error creating budget notification:', error);
    }
  }

  static async notifyBudgetUpdated(userId: string, budget: Budget, isNew: boolean) {
    try {
      const title = isNew ? '💰 Budget Created' : '✏️ Budget Updated';
      const action = isNew ? 'created' : 'updated';
      
      await this.createNotification(userId, {
        type: 'budget_alert',
        title,
        message: `Your ${budget.period} budget for ${budget.category} has been ${action} to $${budget.amount}.`,
        data: {
          category: budget.category,
          budgetAmount: budget.amount,
          period: budget.period,
          action
        },
        priority: 'low'
      });
    } catch (error) {
      console.error('Error creating budget update notification:', error);
    }
  }

  static async notifyGoalCreated(userId: string, goal: SavingGoal) {
    try {
      const progressPercentage = ((goal.saved || 0) / goal.target * 100).toFixed(1);
      
      await this.createNotification(userId, {
        type: 'goal_milestone',
        title: '🎯 Savings Goal Created',
        message: `Your goal "${goal.name}" has been created with a target of $${goal.target}. You're currently at ${progressPercentage}% of your goal!`,
        data: {
          goalId: goal.id,
          goalName: goal.name,
          targetAmount: goal.target,
          currentAmount: goal.saved || 0,
          action: 'created'
        },
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error creating goal notification:', error);
    }
  }

  static async notifyExpenseAdded(userId: string, expense: Expense, budgetStatus?: BudgetStatus) {
    try {
      let message = `Added expense of $${expense.amount} for ${expense.category}.`;
      let priority: 'low' | 'normal' | 'high' = 'low';
      
      // If budget status is provided, include budget information
      if (budgetStatus) {
        const percentageNum = (budgetStatus.spent / budgetStatus.budget * 100);
        const percentage = percentageNum.toFixed(0);
        if (percentageNum >= 90) {
          message += ` ⚠️ You're now at ${percentage}% of your ${expense.category} budget!`;
          priority = 'high';
        } else if (percentageNum >= 75) {
          message += ` You've used ${percentage}% of your ${expense.category} budget.`;
          priority = 'normal';
        }
      }
      
      await this.createNotification(userId, {
        type: 'budget_alert',
        title: '💳 Expense Recorded',
        message,
        data: {
          expenseId: expense.id,
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          budgetPercentage: budgetStatus ? (budgetStatus.spent / budgetStatus.budget * 100).toFixed(1) : null,
          action: 'expense_added'
        },
        priority
      });
    } catch (error) {
      console.error('Error creating expense notification:', error);
    }
  }
}