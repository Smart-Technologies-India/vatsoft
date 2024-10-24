"use server";

import { errorToString } from "@/utils/methods";
import { challan, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetDeptChallanPayload {
  dept: SelectOffice;
  skip: number;
  take: number;
}

const GetDeptChallan = async (
  payload: GetDeptChallanPayload
): Promise<PaginationResponse<challan[] | null>> => {
  const functionname: string = GetDeptChallan.name;

  try {
    const [challan, totalCount] = await Promise.all([
      await prisma.challan.findMany({
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
      prisma.challan.count({
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
      message: challan
        ? "All Challan Get successfully"
        : "Unable to get challan.",
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

export default GetDeptChallan;
