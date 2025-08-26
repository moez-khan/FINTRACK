import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/lib/notification-service';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    const billReminders = await prisma.billReminder.findMany({
      where: { userId: user.id },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json(billReminders);

  } catch (error) {
    console.error('Error fetching bill reminders:', error);
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

    const { name, amount, dueDate, frequency, reminderDays } = await request.json();

    if (!name || !dueDate || !frequency) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, dueDate, frequency' 
      }, { status: 400 });
    }

    const billReminder = await prisma.billReminder.create({
      data: {
        userId: user.id,
        name,
        amount: amount || null,
        dueDate: new Date(dueDate),
        frequency,
        reminderDays: reminderDays || [7, 3, 1]
      }
    });

    // Send immediate notification about the new reminder
    await NotificationService.notifyBillReminderCreated(user.id, billReminder);

    return NextResponse.json(billReminder, { status: 201 });

  } catch (error) {
    console.error('Error creating bill reminder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}