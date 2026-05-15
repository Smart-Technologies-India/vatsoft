"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  commodity_master,
  refinery,
  refinery_sale,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

export type CurrentDvatRefinerySale = refinery_sale & {
  commodity_master: commodity_master;
  refinery: refinery;
  seller_tin_number: tin_number_master;
};

const GetCurrentDvatRefinerySale = async (): Promise<
  ApiResponseType<Array<CurrentDvatRefinerySale> | null>
> => {
  const functionname = GetCurrentDvatRefinerySale.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const currentDvat = await prisma.dvat04.findFirst({
      where: {
        id: currentDvatId,
        deletedAt: null,
      },
      select: {
        tin_master_id: true,
      },
    });

    if (!currentDvat) {
      return createResponse({
        message: "Current DVAT profile not found.",
        functionname,
      });
    }

    const refinerySales = await prisma.refinery_sale.findMany({
      where: {
        seller_tin_numberId: currentDvat.tin_master_id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      include: {
        commodity_master: true,
        refinery: true,
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }, { id: "desc" }],
    });

    return createResponse({
      message: "Refinery sales fetched successfully.",
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

export default GetCurrentDvatRefinerySale;
