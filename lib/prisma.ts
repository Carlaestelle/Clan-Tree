import { PrismaClient } from "@prisma/client";

// Why this file exists at all:
//
// In development, Next.js hot-reloads your code on every save, which
// re-runs this module. If we just did `export const prisma = new
// PrismaClient()` at the top level, every single hot-reload would open a
// brand new connection pool to Neon — after a few dozen edits you'd hit
// Neon's connection limit and everything would start failing with cryptic
// errors. This "global singleton" pattern makes sure only ONE PrismaClient
// ever exists per running process, and Next.js's hot-reload reuses it.
//
// In production this trick is a no-op (each serverless invocation gets
// its own fresh global scope anyway) — it's purely a local-dev fix.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
