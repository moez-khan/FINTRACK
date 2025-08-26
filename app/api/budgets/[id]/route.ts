import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/lib/notification-service';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();


export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify the budget belongs to the user
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    const updatedBudget = await prisma.budget.update({
      where: { id: params.id },
      data: {
        category,
        amount,
        period: period || 'monthly'
      }
    });

    // Send immediate notification about the update
    await NotificationService.notifyBudgetUpdated(user.id, updatedBudget, false);

    return NextResponse.json(updatedBudget);

  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify the budget belongs to the user
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    await prisma.budget.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}