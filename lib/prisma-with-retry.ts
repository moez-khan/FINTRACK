import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma client with retry logic
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Retry logic for database operations
async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && (error as any).code === 'P1001') {
      // P1001 is Prisma's connection error code
      console.log(`Database connection failed, retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 1.5); // Exponential backoff
    }
    throw error;
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to execute operations with retry
export async function executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  return withRetry(operation);
}

export default prisma;