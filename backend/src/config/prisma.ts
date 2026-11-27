import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { env } from './env';

function databaseUrlWithTimeout(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', String(env.DATABASE_CONNECT_TIMEOUT_SECONDS));
    }
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

export const prisma = new PrismaClient({
  datasourceUrl: databaseUrlWithTimeout(env.DATABASE_URL)
});

export async function withDatabaseTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('Database connection timed out')),
          env.DATABASE_CONNECT_TIMEOUT_SECONDS * 1000
        );
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
