import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type PrismaClientLike = {
  workflowRun: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    update: (args: unknown) => Promise<unknown>;
  };
  nodeRun: {
    update: (args: unknown) => Promise<unknown>;
  };
  $transaction: <T>(callback: (tx: PrismaClientLike) => Promise<T>) => Promise<T>;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientLike | null;
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
export async function getPrismaClient(): Promise<PrismaClientLike | null> {
  if (typeof globalForPrisma.prisma !== "undefined") {
    return globalForPrisma.prisma;
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
