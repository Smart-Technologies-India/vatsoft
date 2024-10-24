"use server";

import { errorToString } from "@/utils/methods";
import { challan, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface SearchChallanPayload {
  dvatid?: number;
  cpin?: string;
  fromdate?: Date;
  todate?: Date;
  dept: SelectOffice;
  skip: number;
  take: number;
}

const SearchChallan = async (
  payload: SearchChallanPayload
): Promise<PaginationResponse<challan[] | null>> => {
  const functionname: string = SearchChallan.name;

  try {
    const [challan, totalCount] = await Promise.all([
      prisma.challan.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
          dvat: {
            selectOffice: payload.dept,
          },
          ...(payload.dvatid && { dvatid: payload.dvatid }),
          ...(payload.cpin && { cpin: payload.cpin }),
          ...(payload.fromdate &&
            payload.todate && {
              createdAt: {
                gte: payload.fromdate,
                lte: payload.todate,
              },
            }),
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.challan.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
          dvat: {
            selectOffice: payload.dept,
          },
          ...(payload.dvatid && { dvatid: payload.dvatid }),
          ...(payload.cpin && { cpin: payload.cpin }),
          ...(payload.fromdate &&
            payload.todate && {
              createdAt: {
                gte: payload.fromdate,
                lte: payload.todate,
              },
            }),
        },
      }),
    ]);

    return createPaginationResponse({
      message: challan ? "Challan Get successfully" : "Unable to get challan.",
      functionname: functionname,
      data: challan ?? null,
      skip: payload.skip,
      take: payload.take,
      total: totalCount,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SearchChallan;
