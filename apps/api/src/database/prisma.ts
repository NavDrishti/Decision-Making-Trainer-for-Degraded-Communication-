import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function resolveDatabaseUrl(): string {
  // If an external database URL is provided (e.g. Postgres, Neon, Supabase, Turso), use it
  if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes('./dev.db') &&
    !process.env.DATABASE_URL.includes('file:dev.db') &&
    !process.env.DATABASE_URL.startsWith('file:./')
  ) {
    return process.env.DATABASE_URL;
  }

  // In Vercel serverless or when running on Linux container where root fs is read-only
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !process.env.DATABASE_URL) {
    const tmpDbPath = path.join('/tmp', 'navdrishti.db');

    // Possible locations for seed.db template
    const candidatePaths = [
      path.resolve(process.cwd(), 'prisma', 'seed.db'),
      path.resolve(process.cwd(), 'apps', 'api', 'prisma', 'seed.db'),
      path.resolve(process.cwd(), '..', 'prisma', 'seed.db'),
      path.resolve(process.cwd(), '..', 'api', 'prisma', 'seed.db'),
    ];

    try {
      if (!fs.existsSync(tmpDbPath)) {
        const sourcePath = candidatePaths.find((p) => fs.existsSync(p));
        if (sourcePath) {
          fs.copyFileSync(sourcePath, tmpDbPath);
          console.log(`✅ Loaded seed database from ${sourcePath} to ${tmpDbPath}`);
        } else {
          console.warn('⚠️ Seed database template not found in candidates:', candidatePaths);
        }
      }
    } catch (err) {
      console.error('Error preparing writable /tmp database:', err);
    }

    const fileUrl = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = fileUrl;
    return fileUrl;
  }

  return process.env.DATABASE_URL || 'file:./dev.db';
}

const dbUrl = resolveDatabaseUrl();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
