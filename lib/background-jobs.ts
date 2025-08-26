import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification-service';
import { EmailService } from './email-service';

const prisma = new PrismaClient();

export class BackgroundJobs {
  // Run notification checks for all users
  static async runNotificationChecks() {
    try {
      console.log('Starting notification checks...');
      
      // Get all users with notification preferences
      const users = await prisma.user.findMany({
        include: { notificationPreferences: true }
      });

      const promises = users.map(async (user) => {
        try {
          // Skip if user has disabled notifications
          if (user.notificationPreferences && 
              !user.notificationPreferences.budgetAlerts && 
              !user.notificationPreferences.goalMilestones && 
              !user.notificationPreferences.anomalyAlerts) {
            return;
          }

          await NotificationService.runAllChecks(user.id);
        } catch (error) {
          console.error(`Error checking notifications for user ${user.id}:`, error);
        }
      });

      await Promise.all(promises);

      // Run global checks (bill reminders)
      await NotificationService.runGlobalChecks();
      
      console.log('Notification checks completed');
    } catch (error) {
      console.error('Error in notification checks:', error);
    }
  }

  // Send financial summaries
  static async sendFinancialSummaries() {
    try {
      console.log('Starting financial summary sends...');
      
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayOfMonth = now.getDate();

      // Get users with email summaries enabled
      const users = await prisma.user.findMany({
        where: {
          notificationPreferences: {
            summaryFrequency: {
              not: 'disabled'
            },
            emailEnabled: true
          }
        },
        include: { notificationPreferences: true }
      });

      const promises = users.map(async (user) => {
        try {
          const prefs = user.notificationPreferences;
          if (!prefs) return;

          let shouldSend = false;
          let frequency: 'weekly' | 'monthly' = 'weekly';

          // Check if it's time to send based on frequency
          if (prefs.summaryFrequency === 'daily') {
            shouldSend = true;
            frequency = 'weekly'; // Use weekly for daily (shorter period)
          } else if (prefs.summaryFrequency === 'weekly' && dayOfWeek === 1) {
            // Send on Mondays
            shouldSend = true;
            frequency = 'weekly';
          } else if (prefs.summaryFrequency === 'monthly' && dayOfMonth === 1) {
            // Send on 1st of month
            shouldSend = true;
            frequency = 'monthly';
          }

          if (shouldSend) {
            await EmailService.sendFinancialSummary(user.id, frequency);
          }
        } catch (error) {
          console.error(`Error sending summary for user ${user.id}:`, error);
        }
      });

      await Promise.all(promises);
      
      console.log('Financial summary sends completed');
    } catch (error) {
      console.error('Error in financial summary sends:', error);
    }
  }

  // Cleanup old notifications
  static async cleanupOldNotifications() {
    try {
      console.log('Starting notification cleanup...');
      
      // Delete notifications older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      console.log(`Cleaned up ${result.count} old notifications`);
    } catch (error) {
      console.error('Error in notification cleanup:', error);
    }
  }

  // Update recurring bill reminders
  static async updateRecurringBills() {
    try {
      console.log('Starting recurring bill updates...');
      
      const now = new Date();
      
      // Get paid bills that are recurring
      const paidRecurringBills = await prisma.billReminder.findMany({
        where: {
          isPaid: true,
          frequency: {
            not: 'one-time'
          },
          dueDate: {
            lt: now // Due date has passed
          }
        }
      });

      const promises = paidRecurringBills.map(async (bill) => {
        try {
          let nextDueDate = new Date(bill.dueDate);

          // Calculate next due date based on frequency
          switch (bill.frequency) {
            case 'weekly':
              nextDueDate.setDate(nextDueDate.getDate() + 7);
              break;
            case 'monthly':
              nextDueDate.setMonth(nextDueDate.getMonth() + 1);
              break;
            case 'yearly':
              nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
              break;
          }

          // Update the bill with new due date and mark as unpaid
          await prisma.billReminder.update({
            where: { id: bill.id },
            data: {
              dueDate: nextDueDate,
              isPaid: false
            }
          });
        } catch (error) {
          console.error(`Error updating recurring bill ${bill.id}:`, error);
        }
      });

      await Promise.all(promises);
      
      console.log(`Updated ${paidRecurringBills.length} recurring bills`);
    } catch (error) {
      console.error('Error in recurring bill updates:', error);
    }
  }

  // Main function to run all background jobs
  static async runAllJobs() {
    console.log('Starting background jobs...');
    
    await Promise.all([
      this.runNotificationChecks(),
      this.updateRecurringBills(),
      this.cleanupOldNotifications()
    ]);

    // Run financial summaries separately as it's time-sensitive
    await this.sendFinancialSummaries();
    
    console.log('All background jobs completed');
  }
}

// Export a function that can be called by a cron job or scheduled task
export async function runBackgroundJobs() {
  await BackgroundJobs.runAllJobs();
}