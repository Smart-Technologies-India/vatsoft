"use server";

import { errorToString } from "@/utils/methods";
import { challan, Prisma, returns_01 } from "@prisma/client";
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
  excludeCreatedExpired?: boolean;
}

export type UserChallanWithReturn = challan & {
  returns_01: returns_01 | null;
};

const GetUserChallan = async (
  payload: GetUserChallanPayload
): Promise<PaginationResponse<UserChallanWithReturn[] | null>> => {
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

    const where: Prisma.challanWhereInput = {
      deletedAt: null,
      deletedById: null,
      dvatid: payload.dvatid,
    };

    if (payload.excludeCreatedExpired) {
      where.AND = [
        { paymentstatus: { not: "CREATED" } },
        {
          OR: [
            { order_status: null },
            {
              order_status: {
                notIn: ["Expired", "EXPIRED"],
              },
            },
          ],
        },
      ];
    }

    const [challan, totalCount] = await Promise.all([
      prisma.challan.findMany({
        where,
        include: {
          returns_01: true,
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.challan.count({ where }),
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
