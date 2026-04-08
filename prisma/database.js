import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const PRISMA_HOOK_KEY = "__prismaShutdownHookRegistered";

const prismaClientSingleton = () => {
  const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 5,
  });

  return new PrismaClient({
    adapter: adapter,
    log:
      process.env.NODE_ENV === "development"
        ? // ? ["query", "warn", "error"]
          ["warn", "error"]
        : ["warn", "error"],
  });
};

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

if (!globalThis[PRISMA_HOOK_KEY]) {
  globalThis[PRISMA_HOOK_KEY] = true;

  const closePrisma = async () => {
    try {
      await prisma.$disconnect();
      console.log("Prisma disconnected cleanly");
    } catch (error) {
      console.error("Error while disconnecting Prisma:", error);
    }
  };

  process.once("SIGINT", async () => {
    await closePrisma();
    process.exit(0);
  });

  process.once("SIGTERM", async () => {
    await closePrisma();
    process.exit(0);
  });

  process.once("beforeExit", async () => {
    await closePrisma();
  });
}
