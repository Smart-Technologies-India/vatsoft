"use server";

import { errorToString } from "@/utils/methods";
import {
  commodity_master,
  daily_sale,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetUserDailySalePayload {
  dvatid: number;
  take: number;
  skip: number;
}

const GetUserDailySale = async (
  payload: GetUserDailySalePayload
): Promise<
  PaginationResponse<Array<
    daily_sale & {
      commodity_master: commodity_master;
      seller_tin_number: tin_number_master;
    }
  > | null>
> => {
  const functionname: string = GetUserDailySale.name;

  try {
    const [daily_sale_response, totalCount] = await Promise.all([
      prisma.daily_sale.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          is_dvat_31: false,
          dvat04Id: payload.dvatid,
        },
        include: {
          commodity_master: true,
          seller_tin_number: true,
        },
        take: payload.take,
        skip: payload.skip,
      }),
      prisma.daily_sale.count({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          is_dvat_31: false,
          dvat04Id: payload.dvatid,
        },
      }),
    ]);

    if (!daily_sale_response) {
      return createPaginationResponse({
        message: "No Daily sale found. Please try again.",
        functionname,
      });
    }

    return createPaginationResponse({
      message: "All Daily sale Data get successfully",
      functionname,
      data: daily_sale_response,
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

export default GetUserDailySale;
