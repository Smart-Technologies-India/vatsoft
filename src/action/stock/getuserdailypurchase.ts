"use server";

import { errorToString } from "@/utils/methods";
import {
  commodity_master,
  daily_purchase,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetUserDailyPurchasePayload {
  dvatid: number;
  take: number;
  skip: number;
}

const GetUserDailyPurchase = async (
  payload: GetUserDailyPurchasePayload,
): Promise<
  PaginationResponse<Array<
    daily_purchase & {
      commodity_master: commodity_master;
      seller_tin_number: tin_number_master;
    }
  > | null>
> => {
  const functionname: string = GetUserDailyPurchase.name;

  try {
    const [daily_purchase_response, totalCount] = await Promise.all([
      prisma.daily_purchase.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          is_dvat_30a: false,
          dvat04Id: payload.dvatid,
        },
        include: {
          commodity_master: true,
          seller_tin_number: true,
        },
        orderBy: {
          invoice_date: "asc",
        },
        take: payload.take,
        skip: payload.skip,
      }),
      prisma.daily_purchase.count({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          is_dvat_30a: false,
          dvat04Id: payload.dvatid,
        },
      }),
    ]);

    if (!daily_purchase_response) {
      return createPaginationResponse({
        message: "No Daily Purchase found. Please try again.",
        functionname,
      });
    }

    return createPaginationResponse({
      message: "All Daily Purchase Data get successfully",
      functionname,
      data: daily_purchase_response,
      take: payload.take,
      skip: payload.skip,
      total: totalCount ?? 0,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetUserDailyPurchase;
