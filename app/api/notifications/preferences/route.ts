import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { notificationPreferences: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create default preferences if they don't exist
    if (!user.notificationPreferences) {
      const defaultPreferences = await prisma.notificationPreference.create({
        data: {
          userId: user.id
        }
      });
      return NextResponse.json(defaultPreferences);
    }

    return NextResponse.json(user.notificationPreferences);

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
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
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const {
      emailEnabled,
      pushEnabled,
      smsEnabled,
      summaryFrequency,
      budgetAlerts,
      billReminders,
      goalMilestones,
      anomalyAlerts
    } = await request.json();

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        emailEnabled,
        pushEnabled,
        smsEnabled,
        summaryFrequency,
        budgetAlerts,
        billReminders,
        goalMilestones,
        anomalyAlerts
      },
      create: {
        userId: user.id,
        emailEnabled,
        pushEnabled,
        smsEnabled,
        summaryFrequency,
        budgetAlerts,
        billReminders,
        goalMilestones,
        anomalyAlerts
      }
    });

    return NextResponse.json(preferences);

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}