import { PrismaClient } from "@prisma/client";
import { AppError } from "./http";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  if (!hasDatabaseConfig()) {
    throw new AppError("missing_database_url", 503, "DATABASE_URL is not configured");
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}
