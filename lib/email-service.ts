import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FinancialSummaryData {
  user: {
    name: string;
    email: string;
  };
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  spending: {
    total: number;
    byCategory: Record<string, number>;
    topExpenses: Array<{
      amount: number;
      category: string;
      date: Date;
      notes?: string;
    }>;
  };
  budgets: Array<{
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'under' | 'near' | 'over';
  }>;
  goals: Array<{
    name: string;
    target: number;
    saved: number;
    percentage: number;
    deadline: Date;
    onTrack: boolean;
  }>;
  insights: string[];
  recommendations: string[];
}

export class EmailService {
  static async generateFinancialSummary(userId: string, frequency: 'weekly' | 'monthly'): Promise<FinancialSummaryData | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          budgets: true,
          savingGoals: true
        }
      });

      if (!user) return null;

      // Calculate period dates
      const now = new Date();
      let startDate: Date;
      let label: string;

      if (frequency === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        label = 'This Week';
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        label = 'This Month';
      }

      // Get expenses for the period
      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: now
          }
        },
        orderBy: { amount: 'desc' }
      });

      const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Group by category
      const spendingByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      // Get top 5 expenses
      const topExpenses = expenses.slice(0, 5).map(expense => ({
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        notes: expense.notes ?? undefined
      }));

      // Calculate budget performance
      const budgetPerformance = user.budgets.map(budget => {
        const spent = spendingByCategory[budget.category] || 0;
        const percentage = (spent / budget.amount) * 100;
        let status: 'under' | 'near' | 'over' = 'under';
        
        if (percentage >= 100) status = 'over';
        else if (percentage >= 75) status = 'near';

        return {
          category: budget.category,
          budgeted: budget.amount,
          spent,
          remaining: Math.max(0, budget.amount - spent),
          percentage: Math.round(percentage),
          status
        };
      });

      // Calculate goal progress
      const goalProgress = user.savingGoals.map(goal => {
        const percentage = (goal.saved / goal.target) * 100;
        const monthsRemaining = Math.ceil((goal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
        const monthlyTargetSavings = (goal.target - goal.saved) / Math.max(1, monthsRemaining);
        const onTrack = monthlyTargetSavings <= (goal.target * 0.1); // Reasonable monthly target

        return {
          name: goal.name,
          target: goal.target,
          saved: goal.saved,
          percentage: Math.round(percentage),
          deadline: goal.deadline,
          onTrack
        };
      });

      // Generate insights
      const insights = this.generateInsights(expenses, budgetPerformance, spendingByCategory, frequency);
      const recommendations = this.generateRecommendations(budgetPerformance, goalProgress, spendingByCategory);

      return {
        user: {
          name: user.name || 'User',
          email: user.email
        },
        period: {
          start: startDate,
          end: now,
          label
        },
        spending: {
          total: totalSpending,
          byCategory: spendingByCategory,
          topExpenses
        },
        budgets: budgetPerformance,
        goals: goalProgress,
        insights,
        recommendations
      };

    } catch (error) {
      console.error('Error generating financial summary:', error);
      return null;
    }
  }

  private static generateInsights(
    expenses: any[],
    budgets: any[],
    spendingByCategory: Record<string, number>,
    frequency: 'weekly' | 'monthly'
  ): string[] {
    const insights: string[] = [];

    // Spending trend insight
    if (expenses.length > 0) {
      const avgExpense = expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length;
      insights.push(`Your average transaction this ${frequency === 'weekly' ? 'week' : 'month'} was $${avgExpense.toFixed(2)}`);
    }

    // Top category insight
    const topCategory = Object.entries(spendingByCategory)
      .sort(([,a], [,b]) => b - a)[0];
    if (topCategory) {
      insights.push(`${topCategory[0]} was your biggest expense category at $${topCategory[1].toFixed(2)}`);
    }

    // Budget performance insight
    const overBudgetCategories = budgets.filter(b => b.status === 'over').length;
    if (overBudgetCategories > 0) {
      insights.push(`You exceeded ${overBudgetCategories} budget${overBudgetCategories > 1 ? 's' : ''} this period`);
    } else {
      const nearBudgetCategories = budgets.filter(b => b.status === 'near').length;
      if (nearBudgetCategories > 0) {
        insights.push(`You're close to your budget limit in ${nearBudgetCategories} categor${nearBudgetCategories > 1 ? 'ies' : 'y'}`);
      } else {
        insights.push('Great job staying within your budgets!');
      }
    }

    return insights;
  }

  private static generateRecommendations(
    budgets: any[],
    goals: any[],
    spendingByCategory: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // Budget recommendations
    const overBudgetCategories = budgets.filter(b => b.status === 'over');
    if (overBudgetCategories.length > 0) {
      recommendations.push(`Consider reducing spending in ${overBudgetCategories.map(b => b.category).join(', ')} to get back on track`);
    }

    // Goal recommendations
    const strugglingGoals = goals.filter(g => !g.onTrack);
    if (strugglingGoals.length > 0) {
      recommendations.push(`Review your ${strugglingGoals.map(g => g.name).join(', ')} goal${strugglingGoals.length > 1 ? 's' : ''} - you may need to adjust your timeline or increase savings`);
    }

    // Spending pattern recommendations
    const topSpendingCategory = Object.entries(spendingByCategory)
      .sort(([,a], [,b]) => b - a)[0];
    if (topSpendingCategory && topSpendingCategory[1] > 200) {
      recommendations.push(`Look for ways to optimize your ${topSpendingCategory[0]} spending - even small reductions can add up`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up the great work with your financial management!');
    }

    return recommendations;
  }

  static generateEmailHTML(data: FinancialSummaryData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your ${data.period.label} Financial Summary</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .section { padding: 20px; border-bottom: 1px solid #e2e8f0; }
        .section:last-child { border-bottom: none; }
        .section h2 { margin: 0 0 15px; color: #2d3748; font-size: 18px; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .stat-card { background: #f7fafc; padding: 15px; border-radius: 6px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #2d3748; }
        .stat-label { font-size: 12px; color: #718096; text-transform: uppercase; }
        .budget-item, .goal-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .budget-item:last-child, .goal-item:last-child { border-bottom: none; }
        .progress-bar { width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; }
        .progress-under { background: #48bb78; }
        .progress-near { background: #ed8936; }
        .progress-over { background: #f56565; }
        .insight-list, .recommendation-list { list-style: none; padding: 0; margin: 0; }
        .insight-list li, .recommendation-list li { padding: 8px 0; padding-left: 20px; position: relative; }
        .insight-list li:before { content: "💡"; position: absolute; left: 0; }
        .recommendation-list li:before { content: "💭"; position: absolute; left: 0; }
        .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your ${data.period.label} Financial Summary</h1>
            <p>Hello ${data.user.name}! Here's how your finances looked ${data.period.label.toLowerCase()}.</p>
        </div>

        <div class="section">
            <h2>📊 Spending Overview</h2>
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-value">$${data.spending.total.toFixed(2)}</div>
                    <div class="stat-label">Total Spent</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Object.keys(data.spending.byCategory).length}</div>
                    <div class="stat-label">Categories</div>
                </div>
            </div>
            
            ${data.spending.topExpenses.length > 0 ? `
            <h3>Top Expenses</h3>
            ${data.spending.topExpenses.map(expense => `
                <div class="budget-item">
                    <div>
                        <strong>$${expense.amount.toFixed(2)}</strong> - ${expense.category}
                        ${expense.notes ? `<br><small style="color: #718096;">${expense.notes}</small>` : ''}
                    </div>
                    <small>${expense.date.toLocaleDateString()}</small>
                </div>
            `).join('')}
            ` : ''}
        </div>

        ${data.budgets.length > 0 ? `
        <div class="section">
            <h2>💰 Budget Performance</h2>
            ${data.budgets.map(budget => `
                <div class="budget-item">
                    <div>
                        <strong>${budget.category}</strong><br>
                        <small>$${budget.spent.toFixed(2)} of $${budget.budgeted.toFixed(2)} (${budget.percentage}%)</small>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill progress-${budget.status}" style="width: ${Math.min(100, budget.percentage)}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.goals.length > 0 ? `
        <div class="section">
            <h2>🎯 Savings Goals</h2>
            ${data.goals.map(goal => `
                <div class="goal-item">
                    <div>
                        <strong>${goal.name}</strong><br>
                        <small>$${goal.saved.toFixed(2)} of $${goal.target.toFixed(2)} (${goal.percentage}%)</small>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill progress-${goal.onTrack ? 'under' : 'near'}" style="width: ${Math.min(100, goal.percentage)}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h2>💡 Key Insights</h2>
            <ul class="insight-list">
                ${data.insights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>💭 Recommendations</h2>
            <ul class="recommendation-list">
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
            
            <div style="text-align: center; margin-top: 20px;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard" class="cta-button">View Full Dashboard</a>
            </div>
        </div>

        <div class="footer">
            <p>This summary was generated automatically by FinTrack.</p>
            <p><a href="${process.env.NEXTAUTH_URL}/settings/notifications" style="color: #cbd5e0;">Manage notification preferences</a></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // This would integrate with your email service (SendGrid, Mailgun, etc.)
  static async sendFinancialSummary(userId: string, frequency: 'weekly' | 'monthly') {
    try {
      const summaryData = await this.generateFinancialSummary(userId, frequency);
      if (!summaryData) return false;

      const htmlContent = this.generateEmailHTML(summaryData);
      
      // Here you would integrate with your email service
      console.log('Email would be sent to:', summaryData.user.email);
      console.log('Subject:', `Your ${summaryData.period.label} Financial Summary`);
      console.log('HTML Content generated successfully');

      // Example with a hypothetical email service:
      // await emailService.send({
      //   to: summaryData.user.email,
      //   subject: `Your ${summaryData.period.label} Financial Summary`,
      //   html: htmlContent
      // });

      return true;
    } catch (error) {
      console.error('Error sending financial summary:', error);
      return false;
    }
  }
}