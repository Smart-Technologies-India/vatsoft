"use server";

import { errorToString } from "@/utils/methods";
import { refunds } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetUserRefundsPayload {
  dvatid: number;
  skip: number;
  take: number;
}

const GetUserRefunds = async (
  payload: GetUserRefundsPayload
): Promise<PaginationResponse<refunds[] | null>> => {
  const functionname: string = GetUserRefunds.name;

  try {
    const [refunds, totalCount] = await Promise.all([
      prisma.refunds.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
          dvatid: payload.dvatid,
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.refunds.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
          dvatid: payload.dvatid,
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

export default GetUserRefunds;
