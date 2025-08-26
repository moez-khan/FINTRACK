import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '../../../../lib/notification-service';
import { runBackgroundJobs } from '../../../../lib/background-jobs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await request.json();

    // For development/testing purposes - in production you'd want better security
    if (type === 'all_jobs') {
      await runBackgroundJobs();
      return NextResponse.json({ message: 'All background jobs triggered' });
    }

    // Get the current user
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (type) {
      case 'budget_alerts':
        await NotificationService.checkBudgetAlerts(user.id);
        break;
      case 'goal_milestones':
        await NotificationService.checkGoalMilestones(user.id);
        break;
      case 'spending_anomalies':
        await NotificationService.detectSpendingAnomalies(user.id);
        break;
      case 'bill_reminders':
        await NotificationService.checkBillReminders();
        break;
      case 'all_user_checks':
        await NotificationService.runAllChecks(user.id);
        break;
      default:
        return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 });
    }

    return NextResponse.json({ message: `${type} triggered successfully` });

  } catch (error) {
    console.error('Error triggering notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}