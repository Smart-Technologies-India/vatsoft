"use server";

import { errorToString } from "@/utils/methods";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { order_notice } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetUserNoticePayload {
  userid: number;
  take: number;
  skip: number;
}

const GetUserNotice = async (
  payload: GetUserNoticePayload
): Promise<PaginationResponse<order_notice[] | null>> => {
  const functionname: string = GetUserNotice.name;

 

  try {
    const dvat = await prisma.dvat04.findFirst({
      where: {
        createdById: payload.userid,
        deletedAt: null,
        deletedById: null,
        OR: [
          {
            status: "APPROVED",
          },
          {
            status: "PROVISIONAL",
          },
        ],
      },
    });

    if (!dvat) {
      return createPaginationResponse({
        message: "No Dvat Fount for this user",
        functionname,
      });
    }

    const [challan, totalCount] = await Promise.all([
      prisma.order_notice.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          dvatid: dvat.id,
        },
        take: payload.take,
        skip: payload.skip,
      }),
      prisma.order_notice.count({
        where: {
          deletedAt: null,
          deletedById: null,
          dvatid: dvat.id,
        },
      }),
    ]);

    return createPaginationResponse({
      message: challan
        ? "Notice data get successfully"
        : "Unable to get Notice data.",
      functionname: functionname,
      data: challan ?? null,
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

export default GetUserNotice;
