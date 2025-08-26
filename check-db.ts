import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking Neon PostgreSQL Database Connection...\n')
  
  // Get database connection info
  const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()`
  console.log('Database Info:', result)
  
  // Count records
  const userCount = await prisma.user.count()
  const expenseCount = await prisma.expense.count()
  const savingGoalCount = await prisma.savingGoal.count()
  
  console.log('\nRecord Counts:')
  console.log(`- Users: ${userCount}`)
  console.log(`- Expenses: ${expenseCount}`)
  console.log(`- Saving Goals: ${savingGoalCount}`)
  
  // Show actual data
  const users = await prisma.user.findMany({
    include: {
      expenses: true,
      savingGoals: true
    }
  })
  
  console.log('\nData in Neon Database:')
  users.forEach(user => {
    console.log(`\nUser: ${user.email}`)
    console.log(`  Expenses: ${user.expenses.length}`)
    console.log(`  Saving Goals: ${user.savingGoals.length}`)
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })