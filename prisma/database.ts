import { Prisma, PrismaClient } from "@prisma/client";
import { formatISO, parseISO } from "date-fns";

const prismaClientSingleton = () => {
  // const extension = Prisma.defineExtension((client) => {
  //   return client.$extends({
  //     query: {
  //       deparment_doc_upload: {
  //         async create({ model, operation, args, query }) {
  //           console.log("create");
  //           const data = args.data;
  //           if (data.createdAt) {
  //             console.log(formatISO(new Date(data.createdAt)));
  //             data.createdAt = formatISO(new Date(data.createdAt));
  //           }
  //           if (data.updatedAt) {
  //             console.log(formatISO(new Date(data.updatedAt)));
  //             data.updatedAt = formatISO(new Date(data.updatedAt));
  //           }
  //           if (data.deletedAt) {
  //             console.log(formatISO(new Date(data.deletedAt)));
  //             data.deletedAt = formatISO(new Date(data.deletedAt));
  //           }

  //           return query(args); // Continue with the query
  //         },
  //       },
  //     },
  //   });
  // });

  // const prisma = new PrismaClient().$extends(extension);
  const prisma = new PrismaClient();

  // // Middleware to handle DateTime as plain strings
  // prisma.$use(async (params, next) => {
  //   // Check if the action involves a 'deparment_doc_upload' model
  //   if (params.model === "deparment_doc_upload") {
  //     // Handle "create" and "update" actions to store DateTime as plain strings
  //     if (["create", "update"].includes(params.action)) {
  //       const data = params.args.data;
  //       console.log("create - update");

  //       if (data.createdAt) {
  //         console.log(formatISO(new Date(data.createdAt)));
  //         data.createdAt = formatISO(new Date(data.createdAt));
  //       }
  //       if (data.updatedAt) {
  //         console.log(formatISO(new Date(data.updatedAt)));
  //         data.updatedAt = formatISO(new Date(data.updatedAt));
  //       }
  //       if (data.deletedAt) {
  //         console.log(formatISO(new Date(data.deletedAt)));
  //         data.deletedAt = formatISO(new Date(data.deletedAt));
  //       }
  //     }

  //     // Handle "find" actions to convert DateTime from strings to Date objects
  //     if (["findUnique", "findFirst", "findMany"].includes(params.action)) {
  //       const result = await next(params);

  //       if (result) {
  //         if (Array.isArray(result)) {
  //           result.forEach((record) => convertDateFields(record));
  //         } else {
  //           convertDateFields(result);
  //         }
  //       }

  //       return result;
  //     }
  //   }

  //   // Proceed with the next middleware
  //   return next(params);
  // });

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
