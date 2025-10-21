/**
 * Prisma Client Singleton
 *
 * This ensures that only one instance of Prisma Client is created
 * and reused across the application, preventing connection exhaustion
 * in development mode where hot reloading creates new instances.
 */

import { PrismaClient } from '@prisma/client';

// Extend the global namespace to include our prisma property
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a single instance of Prisma Client
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// In development, save the instance to the global object
// This prevents creating new instances on every hot reload
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
