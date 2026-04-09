import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const PRISMA_HOOK_KEY = "__prismaShutdownHookRegistered";
const PRISMA_CLIENT_KEY = "__vatsoftPrismaClient";

type GlobalWithPrisma = typeof globalThis & {
  [PRISMA_CLIENT_KEY]?: PrismaClient;
};

const parseNumber = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const getConnectionConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const parsedUrl = new URL(databaseUrl);

    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port ? Number.parseInt(parsedUrl.port, 10) : undefined,
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
      database: parsedUrl.pathname.replace(/^\//, ""),
    };
  }

  return {
    host: process.env.DATABASE_HOST,
    port: parseNumber(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  };
};

const prismaClientSingleton = () => {
  const connectionConfig = getConnectionConfig();
  const adapter = new PrismaMariaDb({
    ...connectionConfig,
    connectionLimit: parseNumber(process.env.DATABASE_CONNECTION_LIMIT) ?? 10,
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

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prismaGlobal = globalThis as GlobalWithPrisma;
const prisma = prismaGlobal[PRISMA_CLIENT_KEY] ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

prismaGlobal[PRISMA_CLIENT_KEY] = prisma;

if (!(globalThis as Record<string, unknown>)[PRISMA_HOOK_KEY]) {
  (globalThis as Record<string, unknown>)[PRISMA_HOOK_KEY] = true;

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
