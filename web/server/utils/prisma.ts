import { PrismaClient } from '@prisma/client'

// Singleton pattern: reuse the same PrismaClient across hot reloads in dev.
// Without this, every file change would spawn a new DB connection and exhaust the pool.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

// Only cache on globalThis in dev — production never hot-reloads so it's unnecessary.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
