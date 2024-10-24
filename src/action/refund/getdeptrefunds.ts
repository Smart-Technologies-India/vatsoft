"use server";

import { errorToString } from "@/utils/methods";
import { refunds, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import { createPaginationResponse, PaginationResponse } from "@/models/response";

interface GetDeptRefundsPayload {
  dept: SelectOffice;
  skip: number;
  take: number;
}

const GetDeptRefunds = async (
  payload: GetDeptRefundsPayload
): Promise<PaginationResponse<refunds[] | null>> => {
  const functionname: string = GetDeptRefunds.name;

  try {
    const [refunds_response, totalCount] = await Promise.all([
      prisma.refunds.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
          dvat: {
            selectOffice: payload.dept,
          },
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.refunds.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
          dvat: {
            selectOffice: payload.dept,
          },
        },
      }),
    ]);

    return createPaginationResponse({
      message: refunds_response
        ? "All refunds Get successfully"
        : "Unable to get refunds.",
      functionname: functionname,
      data: refunds_response ?? null,
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

export default GetDeptRefunds;
