import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/lib/notification-service';

const prisma = new PrismaClient();

// GET /api/expenses - Get all expenses for logged-in user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, type, category, date, notes } = body;

    // Validation
    if (!amount || !type || !category || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "income" or "expense"' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        amount,
        type,
        category,
        date: parsedDate,
        notes: notes || null,
        userId: session.user.id
      }
    });

    // Check budget status if it's an expense (not income)
    if (type === 'expense') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Find budget for this category
      const budget = await prisma.budget.findFirst({
        where: {
          userId: session.user.id,
          category,
          period: 'monthly'
        }
      });

      if (budget) {
        // Calculate current spending
        const monthlyExpenses = await prisma.expense.findMany({
          where: {
            userId: session.user.id,
            category,
            type: 'expense',
            date: {
              gte: startOfMonth,
              lte: now
            }
          }
        });

        const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        // Send notification with budget status
        await NotificationService.notifyExpenseAdded(session.user.id, expense, {
          spent: totalSpent,
          budget: budget.amount
        });
      } else {
        // Send notification without budget status
        await NotificationService.notifyExpenseAdded(session.user.id, expense);
      }
    }

    return NextResponse.json(
      { 
        message: 'Expense created successfully',
        expense 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}