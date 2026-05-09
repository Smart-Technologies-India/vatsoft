"use server";

import { errorToString } from "@/utils/methods";
import { challan } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface GetUserChallanPayload {
  dvatid: number;
  skip: number;
  take: number;
}

const GetUserChallan = async (
  payload: GetUserChallanPayload
): Promise<PaginationResponse<challan[] | null>> => {
  const functionname: string = GetUserChallan.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetUserChallan",
      } as any;
    }

    const [challan, totalCount] = await Promise.all([
      prisma.challan.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          dvatid: payload.dvatid,
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.challan.count({
        where: {
          deletedAt: null,
          deletedById: null,
          dvatid: payload.dvatid,
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

export default GetUserChallan;
