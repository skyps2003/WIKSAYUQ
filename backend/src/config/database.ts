import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

/**
 * Lightweight probe: runs `SELECT 1` with a 5-second timeout.
 * Returns true when the database is reachable, false otherwise.
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$queryRawUnsafe('SELECT 1'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB health-check timeout')), 5000),
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns true when the Prisma error indicates the database is unreachable,
 * has invalid credentials, or the connection pool is exhausted.
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const code = (error as any).code as string | undefined;
    // P1001 = Can't reach database server
    // P1002 = Database server timed out
    // P1003 = Database does not exist
    // P1008 = Operations timed out
    // P1010 = Authentication denied (bad credentials)
    // P1017 = Server has closed the connection
    // P2024 = Timed out fetching a connection from the pool
    if (code && /^P(100[1-3]|1008|1010|1017|2024)$/.test(code)) {
      return true;
    }
    const name = (error as any).constructor?.name as string | undefined;
    if (name === 'PrismaClientInitializationError') {
      return true;
    }
  }
  return false;
}
