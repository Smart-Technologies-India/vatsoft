"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { refinery_sale, commodity_master, tin_number_master } from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

type RefinerySaleWithRelations = refinery_sale & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
};

const GetUserRefinerySale = async (): Promise<
  ApiResponseType<Array<RefinerySaleWithRelations> | null>
> => {
  const functionname: string = GetUserRefinerySale.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const refineryResponse = await prisma.refinery.findFirst({
      where: {
        deletedAt: null,
        createdById: currentUserId,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!refineryResponse) {
      return createResponse({
        message: "No refinery profile found for this account.",
        functionname,
      });
    }

    const refinerySales = await prisma.refinery_sale.findMany({
      where: {
        refineryId: refineryResponse.id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }, { id: "desc" }],
    });

    return createResponse({
      message: "Refinery sale entries fetched successfully.",
      functionname,
      data: refinerySales,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetUserRefinerySale;
