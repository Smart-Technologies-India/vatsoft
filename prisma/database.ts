import { Prisma, PrismaClient } from "@prisma/client";
import { formatISO, parseISO } from "date-fns";

const prismaClientSingleton = () => {
  const prisma = new PrismaClient();
  return prisma;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

function convertDateFields(record: any) {
  if (record.createdAt) record.createdAt = parseISO(record.createdAt);
  if (record.updatedAt) record.updatedAt = parseISO(record.updatedAt);
  if (record.deletedAt)
    record.deletedAt = record.deletedAt ? parseISO(record.deletedAt) : null;
}
