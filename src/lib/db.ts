/**
 * Prisma Client Singleton
 * Prevents multiple instances during development (hot reload)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ─── Configuration ─────────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL!;
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const LOG_CONFIG = isDevelopment ? ['query', 'error', 'warn'] : ['error'];

// ─── Singleton Setup ───────────────────────────────────────────────────────────

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: LOG_CONFIG as ('query' | 'error' | 'warn')[],
});

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
