import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBarChart() {
  try {
    // Find the first user
    const user = await prisma.user.findFirst({
      include: {
        expenses: true
      }
    });

    if (!user) {
      console.log('No user found in database');
      return;
    }

    console.log('User found:', user.email);
    console.log('Total expenses:', user.expenses.length);

    // Group expenses by category
    const categoryData: Record<string, { count: number; total: number; type: Set<string> }> = {};
    
    user.expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      if (!categoryData[category]) {
        categoryData[category] = { count: 0, total: 0, type: new Set() };
      }
      categoryData[category].count++;
      categoryData[category].total += expense.amount;
      categoryData[category].type.add(expense.type);
    });

    console.log('\n=== Category Breakdown ===');
    Object.entries(categoryData)
      .sort(([,a], [,b]) => b.total - a.total)
      .forEach(([category, data]) => {
        console.log(`${category}:`);
        console.log(`  Count: ${data.count}`);
        console.log(`  Total: $${data.total.toFixed(2)}`);
        console.log(`  Types: ${Array.from(data.type).join(', ')}`);
      });

    // Check for income vs expense distribution
    const incomeCount = user.expenses.filter(e => e.type === 'income').length;
    const expenseCount = user.expenses.filter(e => e.type === 'expense').length;
    
    console.log('\n=== Type Distribution ===');
    console.log(`Income transactions: ${incomeCount}`);
    console.log(`Expense transactions: ${expenseCount}`);

    // Check for categories with zero or negative amounts
    const problematicCategories = Object.entries(categoryData)
      .filter(([,data]) => data.total <= 0);
    
    if (problematicCategories.length > 0) {
      console.log('\n=== Categories with zero or negative totals ===');
      problematicCategories.forEach(([category, data]) => {
        console.log(`${category}: $${data.total.toFixed(2)}`);
      });
    }

  } catch (error) {
    console.error('Error testing bar chart data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBarChart();