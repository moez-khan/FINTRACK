import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-with-retry';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'pending', 'paid', 'all'

    const where: any = { userId: session.user.id };
    
    if (status === 'pending') {
      where.isPaid = false;
    } else if (status === 'paid') {
      where.isPaid = true;
    }

    const payables = await prisma.payable.findMany({
      where,
      orderBy: [
        { isPaid: 'asc' },
        { priority: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Calculate summary statistics
    const totalOwed = payables.filter(p => !p.isPaid).reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = payables.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);
    const partiallyPaid = payables.filter(p => !p.isPaid).reduce((sum, p) => sum + p.paidAmount, 0);
    const pendingCount = payables.filter(p => !p.isPaid).length;
    const paidCount = payables.filter(p => p.isPaid).length;

    // Find overdue payables
    const now = new Date();
    const overdue = payables.filter(p => !p.isPaid && p.dueDate && new Date(p.dueDate) < now);

    return NextResponse.json({ 
      payables,
      summary: {
        totalOwed,
        totalPaid,
        partiallyPaid,
        pendingCount,
        paidCount,
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching payables:', error);
    return NextResponse.json({ error: 'Failed to fetch payables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, amount, description, dueDate, category, priority, notes } = body;

    // Validation
    if (!name || !amount) {
      return NextResponse.json({ error: 'Name and amount are required' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    const payable = await prisma.payable.create({
      data: {
        name,
        amount: parseFloat(amount),
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        category: category || 'Personal',
        priority: priority || 'Medium',
        notes,
        userId: session.user.id
      }
    });

    return NextResponse.json({ 
      message: 'Payable created successfully', 
      payable 
    });
  } catch (error) {
    console.error('Error creating payable:', error);
    return NextResponse.json({ error: 'Failed to create payable' }, { status: 500 });
  }
}