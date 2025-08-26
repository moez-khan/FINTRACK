// Test script for immediate notifications
// Run with: npx tsx test-immediate-notifications.ts

async function testImmediateNotifications() {
  const baseUrl = 'http://localhost:3000/api';
  
  // You'll need to get a valid session token first
  // For testing, you can get this from browser DevTools after logging in
  const sessionToken = process.env.SESSION_TOKEN || '';
  
  if (!sessionToken) {
    console.error('Please set SESSION_TOKEN environment variable');
    console.log('1. Login to the app in your browser');
    console.log('2. Open DevTools > Application > Cookies');
    console.log('3. Copy the value of next-auth.session-token');
    console.log('4. Run: SESSION_TOKEN="your-token" npx tsx test-immediate-notifications.ts');
    process.exit(1);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `next-auth.session-token=${sessionToken}`
  };

  console.log('🚀 Testing Immediate Notifications System\n');

  // Test 1: Create a bill reminder
  console.log('📝 Test 1: Creating bill reminder...');
  try {
    const billResponse = await fetch(`${baseUrl}/bill-reminders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Electric Bill',
        amount: 150,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        frequency: 'monthly',
        reminderDays: [7, 3, 1]
      })
    });

    if (billResponse.ok) {
      const bill = await billResponse.json();
      console.log('✅ Bill reminder created:', bill);
      
      // Check notifications
      const notifResponse = await fetch(`${baseUrl}/notifications?limit=1`, {
        headers
      });
      
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        const latestNotif = notifData.notifications[0];
        if (latestNotif && latestNotif.title.includes('Bill Reminder Created')) {
          console.log('✅ Notification received:', latestNotif.title);
          console.log('   Message:', latestNotif.message);
        }
      }
    } else {
      console.error('❌ Failed to create bill reminder:', await billResponse.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n---\n');

  // Test 2: Create a budget
  console.log('💰 Test 2: Creating budget...');
  try {
    const budgetResponse = await fetch(`${baseUrl}/budgets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        category: 'Groceries',
        amount: 500,
        period: 'monthly'
      })
    });

    if (budgetResponse.ok) {
      const budget = await budgetResponse.json();
      console.log('✅ Budget created:', budget);
      
      // Check notifications
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
      const notifResponse = await fetch(`${baseUrl}/notifications?limit=1`, {
        headers
      });
      
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        const latestNotif = notifData.notifications[0];
        if (latestNotif && latestNotif.title.includes('Budget')) {
          console.log('✅ Notification received:', latestNotif.title);
          console.log('   Message:', latestNotif.message);
        }
      }
    } else {
      console.error('❌ Failed to create budget:', await budgetResponse.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n---\n');

  // Test 3: Create a saving goal
  console.log('🎯 Test 3: Creating saving goal...');
  try {
    const goalResponse = await fetch(`${baseUrl}/saving-goals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Vacation Fund',
        target: 3000,
        saved: 500,
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 6 months from now
      })
    });

    if (goalResponse.ok) {
      const goal = await goalResponse.json();
      console.log('✅ Saving goal created:', goal.savingGoal);
      
      // Check notifications
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
      const notifResponse = await fetch(`${baseUrl}/notifications?limit=1`, {
        headers
      });
      
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        const latestNotif = notifData.notifications[0];
        if (latestNotif && latestNotif.title.includes('Savings Goal Created')) {
          console.log('✅ Notification received:', latestNotif.title);
          console.log('   Message:', latestNotif.message);
        }
      }
    } else {
      console.error('❌ Failed to create saving goal:', await goalResponse.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n---\n');

  // Test 4: Create an expense
  console.log('💳 Test 4: Creating expense...');
  try {
    const expenseResponse = await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: 85,
        type: 'expense',
        category: 'Groceries',
        date: new Date().toISOString(),
        notes: 'Weekly shopping'
      })
    });

    if (expenseResponse.ok) {
      const expense = await expenseResponse.json();
      console.log('✅ Expense created:', expense.expense);
      
      // Check notifications
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
      const notifResponse = await fetch(`${baseUrl}/notifications?limit=1`, {
        headers
      });
      
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        const latestNotif = notifData.notifications[0];
        if (latestNotif && latestNotif.title.includes('Expense Recorded')) {
          console.log('✅ Notification received:', latestNotif.title);
          console.log('   Message:', latestNotif.message);
        }
      }
    } else {
      console.error('❌ Failed to create expense:', await expenseResponse.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n---\n');
  console.log('📊 Test Summary:');
  console.log('All immediate notifications should now be visible in the notification bell!');
  console.log('\nTo view all notifications:');
  console.log('1. Go to your dashboard');
  console.log('2. Click the notification bell icon in the header');
  console.log('3. You should see all the notifications created by this test');
}

// Run the test
testImmediateNotifications().catch(console.error);