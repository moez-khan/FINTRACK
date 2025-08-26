import { PrismaClient } from '@prisma/client';
import { NotificationService } from './lib/notification-service';

const prisma = new PrismaClient();

async function testNotifications() {
  try {
    // Get the first user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('No user found');
      return;
    }
    
    console.log('Testing notifications for user:', user.email);
    
    // Create a test budget to trigger budget alerts
    console.log('\n1. Creating test budget...');
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        category: 'Shopping',
        amount: 100,
        period: 'monthly'
      }
    });
    console.log('Budget created:', budget.category, '$', budget.amount);
    
    // Create a test saving goal
    console.log('\n2. Creating test saving goal...');
    const goal = await prisma.savingGoal.create({
      data: {
        userId: user.id,
        name: 'Emergency Fund',
        target: 10000,
        saved: 2600, // 26% to trigger 25% milestone
        deadline: new Date('2024-12-31')
      }
    });
    console.log('Goal created:', goal.name, goal.saved, '/', goal.target);
    
    // Create a test bill reminder
    console.log('\n3. Creating test bill reminder...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const billReminder = await prisma.billReminder.create({
      data: {
        userId: user.id,
        name: 'Internet Bill',
        amount: 59.99,
        dueDate: tomorrow,
        frequency: 'monthly',
        reminderDays: [7, 3, 1],
        isPaid: false
      }
    });
    console.log('Bill reminder created:', billReminder.name, 'due:', billReminder.dueDate);
    
    // Manually create some notifications for testing
    console.log('\n4. Creating welcome notification...');
    await NotificationService.createNotification(user.id, {
      type: 'summary',
      title: 'Welcome to FinTrack!',
      message: '🎉 Your financial tracking system is set up and ready. Start by adding transactions and setting budgets.',
      priority: 'normal'
    });
    
    console.log('\n5. Running notification checks...');
    
    // Run all checks
    await NotificationService.checkBudgetAlerts(user.id);
    await NotificationService.checkGoalMilestones(user.id);
    await NotificationService.checkBillReminders();
    await NotificationService.detectSpendingAnomalies(user.id);
    
    // Check what notifications were created
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n✅ Notifications created:', notifications.length);
    notifications.forEach(n => {
      console.log(`- [${n.priority}] ${n.type}: ${n.title}`);
      console.log(`  ${n.message}`);
    });
    
  } catch (error) {
    console.error('Error testing notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotifications();