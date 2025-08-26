import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/lib/notification-service';

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const budgets = await prisma.budget.findMany({
      where: { userId: user.id },
      orderBy: { category: 'asc' }
    });

    return NextResponse.json(budgets);

  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { category, amount, period } = await request.json();

    if (!category || !amount || amount <= 0) {
      return NextResponse.json({ 
        error: 'Invalid category or amount' 
      }, { status: 400 });
    }

    // Check if this is a new budget or an update
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: user.id,
        category,
        period: period || 'monthly'
      }
    });

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_period: {
          userId: user.id,
          category,
          period: period || 'monthly'
        }
      },
      update: { amount },
      create: {
        userId: user.id,
        category,
        amount,
        period: period || 'monthly'
      }
    });

    // Send immediate notification about the budget
    await NotificationService.notifyBudgetUpdated(user.id, budget, !existingBudget);

    return NextResponse.json(budget, { status: 201 });

  } catch (error) {
    console.error('Error creating/updating budget:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}