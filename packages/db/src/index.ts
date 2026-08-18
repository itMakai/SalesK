// ─────────────────────────────────────────────
// SalesK — Database Package Entry Point
// Re-exports the Prisma Client for use across apps
// ─────────────────────────────────────────────

export { PrismaClient, Prisma } from '@prisma/client';

// Singleton Prisma Client instance
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
