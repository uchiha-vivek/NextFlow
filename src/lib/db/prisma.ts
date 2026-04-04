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

/**
 * Lazily creates a Prisma client and caches it on `globalThis` to avoid hot-reload reconnect churn.
 */
export async function getPrismaClient(): Promise<PrismaClientLike | null> {
  if (typeof globalForPrisma.prisma !== "undefined") {
    return globalForPrisma.prisma;
  }

  try {
    const prismaModule = (await import("@prisma/client")) as {
      PrismaClient?: new (options?: unknown) => PrismaClientLike;
    };

    if (!prismaModule.PrismaClient) {
      globalForPrisma.prisma = null;
      return null;
    }

    globalForPrisma.prisma = new prismaModule.PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    return globalForPrisma.prisma;
  } catch {
    globalForPrisma.prisma = null;
    return null;
  }
}
