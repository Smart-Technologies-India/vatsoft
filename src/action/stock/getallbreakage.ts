"use server";

import { errorToString } from "@/utils/methods";
import { breakage, commodity_master } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

interface GetAllBreakagePayload {
  dvatid: number;
  take: number;
  skip: number;
}

const GetAllBreakage = async (
  payload: GetAllBreakagePayload,
): Promise<
  PaginationResponse<Array<breakage & { commodity_master: commodity_master }> | null>
> => {
  const functionname: string = GetAllBreakage.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetAllBreakage",
      } as any;
    }

    const [breakageRows, totalCount] = await Promise.all([
      prisma.breakage.findMany({
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
      prisma.breakage.count({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
        },
      }),
    ]);

    if (!breakageRows) {
      return createPaginationResponse({
        message: "No breakage found. Please try again.",
        functionname,
      });
    }

    return createPaginationResponse({
      message: "All breakage data fetched successfully.",
      functionname,
      data: breakageRows,
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

export default GetAllBreakage;
