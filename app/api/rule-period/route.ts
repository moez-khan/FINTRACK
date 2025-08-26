import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { getPeriodBounds, getNextPeriodStart, isPeriodComplete } from '@/lib/periodUtils';
import { filterExpensesByPeriod, calculatePeriodIncome } from '@/lib/financeRulesWithPeriod';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        rulePeriods: {
          orderBy: { startDate: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current period bounds
    const currentPeriod = getPeriodBounds(
      user.rulePeriod as any,
      user.periodStartDate,
      user.customPeriodDays || undefined
    );

    // Check if current period needs to be completed
    const needsReset = isPeriodComplete(currentPeriod.end);

    return NextResponse.json({
      currentSettings: {
        rulePeriod: user.rulePeriod,
        customPeriodDays: user.customPeriodDays,
        periodStartDate: user.periodStartDate,
        autoResetEnabled: user.autoResetEnabled
      },
      currentPeriod: {
        ...currentPeriod,
        isComplete: needsReset,
        daysRemaining: Math.max(0, Math.ceil((currentPeriod.end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      },
      historicalPeriods: user.rulePeriods
    });

  } catch (error) {
    console.error('Error fetching rule period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { expenses: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { rulePeriod, customPeriodDays, autoResetEnabled, forceReset } = await request.json();

    // If forcing reset or period changed, close current period
    if (forceReset || (rulePeriod && rulePeriod !== user.rulePeriod)) {
      // Calculate data for the current period before closing it
      const currentBounds = getPeriodBounds(
        user.rulePeriod as any,
        user.periodStartDate,
        user.customPeriodDays || undefined
      );

      const periodExpenses = filterExpensesByPeriod(
        user.expenses,
        user.rulePeriod as any,
        user.periodStartDate,
        user.customPeriodDays || undefined
      );

      const totalIncome = periodExpenses
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);

      const totalExpenses = periodExpenses
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);

      const totalSavings = periodExpenses
        .filter(e => e.type === 'expense' && 
          ['savings', 'investment', 'retirement', 'emergency fund']
            .some(cat => e.category.toLowerCase().includes(cat)))
        .reduce((sum, e) => sum + e.amount, 0);

      // Save the completed period
      await prisma.rulePeriod.create({
        data: {
          userId: user.id,
          periodType: user.rulePeriod,
          startDate: user.periodStartDate,
          endDate: currentBounds.end,
          totalIncome,
          totalExpenses,
          totalSavings,
          budgetAdherence: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
          savingsRate: totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0,
          isComplete: true,
          ruleData: {
            selectedRule: user.selectedRule,
            savingsPercentage: user.savingsPercentage
          }
        }
      });
    }

    // Update user settings
    const newPeriodStart = forceReset || (rulePeriod && rulePeriod !== user.rulePeriod)
      ? new Date()
      : user.periodStartDate;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        rulePeriod: rulePeriod || user.rulePeriod,
        customPeriodDays: customPeriodDays || user.customPeriodDays,
        periodStartDate: newPeriodStart,
        autoResetEnabled: autoResetEnabled !== undefined ? autoResetEnabled : user.autoResetEnabled
      }
    });

    const newPeriod = getPeriodBounds(
      updatedUser.rulePeriod as any,
      updatedUser.periodStartDate,
      updatedUser.customPeriodDays || undefined
    );

    return NextResponse.json({
      message: 'Period settings updated successfully',
      currentPeriod: newPeriod,
      settings: {
        rulePeriod: updatedUser.rulePeriod,
        customPeriodDays: updatedUser.customPeriodDays,
        periodStartDate: updatedUser.periodStartDate,
        autoResetEnabled: updatedUser.autoResetEnabled
      }
    });

  } catch (error) {
    console.error('Error updating rule period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Auto-reset endpoint (can be called by a cron job)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { expenses: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentBounds = getPeriodBounds(
      user.rulePeriod as any,
      user.periodStartDate,
      user.customPeriodDays || undefined
    );

    // Check if period is complete
    if (!isPeriodComplete(currentBounds.end)) {
      return NextResponse.json({
        message: 'Current period is not yet complete',
        currentPeriod: currentBounds
      });
    }

    // Close current period and start new one
    const periodExpenses = filterExpensesByPeriod(
      user.expenses,
      user.rulePeriod as any,
      user.periodStartDate,
      user.customPeriodDays || undefined
    );

    const totalIncome = periodExpenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = periodExpenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalSavings = periodExpenses
      .filter(e => e.type === 'expense' && 
        ['savings', 'investment', 'retirement', 'emergency fund']
          .some(cat => e.category.toLowerCase().includes(cat)))
      .reduce((sum, e) => sum + e.amount, 0);

    // Save completed period
    await prisma.rulePeriod.create({
      data: {
        userId: user.id,
        periodType: user.rulePeriod,
        startDate: user.periodStartDate,
        endDate: currentBounds.end,
        totalIncome,
        totalExpenses,
        totalSavings,
        budgetAdherence: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
        savingsRate: totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0,
        isComplete: true,
        ruleData: {
          selectedRule: user.selectedRule,
          savingsPercentage: user.savingsPercentage,
          expenseBreakdown: periodExpenses
            .filter(e => e.type === 'expense')
            .reduce((acc, e) => {
              acc[e.category] = (acc[e.category] || 0) + e.amount;
              return acc;
            }, {} as Record<string, number>)
        }
      }
    });

    // Update user with new period start
    const newPeriodStart = getNextPeriodStart(
      user.rulePeriod as any,
      currentBounds.end,
      user.customPeriodDays || undefined
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        periodStartDate: newPeriodStart
      }
    });

    const newPeriod = getPeriodBounds(
      user.rulePeriod as any,
      newPeriodStart,
      user.customPeriodDays || undefined
    );

    // Create notification for period reset
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'period_reset',
        title: 'Financial Period Reset',
        message: `Your ${user.rulePeriod} financial period has been reset. Previous period saved for review.`,
        priority: 'normal',
        data: {
          previousPeriod: {
            start: currentBounds.start,
            end: currentBounds.end,
            totalIncome,
            totalExpenses,
            totalSavings,
            savingsRate: totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Period reset successfully',
      previousPeriod: currentBounds,
      newPeriod,
      summary: {
        totalIncome,
        totalExpenses,
        totalSavings,
        savingsRate: totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0
      }
    });

  } catch (error) {
    console.error('Error resetting period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}