"use server";

import { errorToString } from "@/utils/methods";
import { commodity_master, stock } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetAllStockPayload {
  dvatid: number;
  take: number;
  skip: number;
}

const GetAllStock = async (
  payload: GetAllStockPayload
): Promise<
  PaginationResponse<Array<
    stock & { commodity_master: commodity_master }
  > | null>
> => {
  const functionname: string = GetAllStock.name;

  try {
    const [stock, totalCount] = await Promise.all([
      prisma.stock.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
        },
        include: {
          commodity_master: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: payload.take,
        skip: payload.skip,
      }),
      prisma.stock.count({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
        },
      }),
    ]);

    if (!stock) {
      return createPaginationResponse({
        message: "No stock found. Please try again.",
        functionname,
      });
    }

    return createPaginationResponse({
      message: "All stock Data get successfully",
      functionname,
      data: stock,
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

export default GetAllStock;
