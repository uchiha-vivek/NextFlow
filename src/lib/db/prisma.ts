import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
};

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  return databaseUrl;
}

/**
 * Lazily creates a Prisma client and caches it on `globalThis` to avoid hot-reload reconnect churn.
 */
export async function getPrismaClient(): Promise<PrismaClient | null> {
  if (typeof globalForPrisma.prisma !== "undefined") {
    return globalForPrisma.prisma ?? null;
  }

  try {
    const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });

    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    return globalForPrisma.prisma;
  } catch (error) {
    console.error("Failed to initialize Prisma client", error);
    globalForPrisma.prisma = null;
    return null;
  }
}
