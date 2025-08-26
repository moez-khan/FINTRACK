import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create a user with hashed password
  const hashedPassword = await hash('password123', 10)
  
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      selectedRule: '50/30/20',
      expenses: {
        create: [
          {
            amount: 2500,
            type: 'income',
            category: 'Salary',
            date: new Date('2025-01-15'),
          },
          {
            amount: 150,
            type: 'expense',
            category: 'Groceries',
            date: new Date('2025-01-20'),
          },
          {
            amount: 75,
            type: 'expense',
            category: 'Entertainment',
            date: new Date('2025-01-22'),
          },
        ],
      },
      savingGoals: {
        create: {
          name: 'Emergency Fund',
          target: 5000,
          saved: 1250,
          deadline: new Date('2025-12-31'),
        },
      },
    },
    include: {
      expenses: true,
      savingGoals: true,
    },
  })

  console.log('Seed data created successfully!')
  console.log('Created user:', user.email)
  console.log('Created expenses:', user.expenses.length)
  console.log('Created saving goals:', user.savingGoals.length)
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