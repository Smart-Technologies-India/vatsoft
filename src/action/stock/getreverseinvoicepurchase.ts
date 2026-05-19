"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { commodity_master, daily_purchase, tin_number_master } from "@prisma/client";
import prisma from "../../../prisma/database";

export type ReverseInvoicePurchaseRow = daily_purchase & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
};

const GetReverseInvoicePurchase = async (): Promise<
  ApiResponseType<Array<ReverseInvoicePurchaseRow> | null>
> => {
  const functionname: string = GetReverseInvoicePurchase.name;

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

    const rows = await prisma.daily_purchase.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        dvat04Id: currentDvatId,
        is_accept: true,
        is_dvat_30a: false,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }, { invoice_number: "desc" }],
    });

    return createResponse({
      message: "Reverse invoice purchase rows fetched successfully.",
      functionname,
      data: rows,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetReverseInvoicePurchase;
