"use server";

import { errorToString } from "@/utils/methods";
import { refunds, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface SearchRfundsPayload {
  dvatid?: number;
  cpin?: string;
  fromdate?: Date;
  todate?: Date;
  dept: SelectOffice;
  skip: number;
  take: number;
}

const SearchRefunds = async (
  payload: SearchRfundsPayload
): Promise<PaginationResponse<refunds[] | null>> => {
  const functionname: string = SearchRefunds.name;

  try {
    const [refunds, totalCount] = await Promise.all([
      prisma.refunds.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
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
      prisma.refunds.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
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
      message: refunds ? "Refunds Get successfully" : "Unable to get refunds.",
      functionname: functionname,
      data: refunds ?? null,
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

export default SearchRefunds;
