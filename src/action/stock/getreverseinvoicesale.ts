"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import {
  commodity_master,
  daily_sale,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";

export type ReverseInvoiceSaleRow = daily_sale & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
};

const GetReverseInvoiceSale = async (): Promise<
  ApiResponseType<Array<ReverseInvoiceSaleRow> | null>
> => {
  const functionname: string = GetReverseInvoiceSale.name;

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

    const rows = await prisma.daily_sale.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        dvat04Id: currentDvatId,
        is_dvat_31: false,
        is_accept: true,
        seller_tin_number: {
          deletedAt: null,
          status: "ACTIVE",
          dvat04: {
            none: {
              deletedAt: null,
              deletedBy: null,
            },
          },
        },
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }, { invoice_number: "desc" }],
    });

    return createResponse({
      message: "Reverse invoice sale rows fetched successfully.",
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

export default GetReverseInvoiceSale;
