"use server";
interface GetUserTrackPaymentPayload {
  user_id: number;
  skip: number;
  take: number;
}

import { errorToString } from "@/utils/methods";
import { returns_01 } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { getCurrentDvatId } from "@/lib/auth";

const GetUserTrackPayment = async (
  payload: GetUserTrackPaymentPayload,
): Promise<PaginationResponse<returns_01[] | null>> => {
  const functionname: string = GetUserTrackPayment.name;
  try {
    const dvatid = await getCurrentDvatId();

    if (!dvatid) {
      return createPaginationResponse({
        message: "Invalid user id. Please try again.",
        functionname,
      });
    }

    const [dvat04response, totalCount] = await Promise.all([
      prisma.returns_01.findMany({
        where: {
          deletedAt: null,
          deletedBy: null,
          dvat04Id: dvatid,
          // dvat04Id
          // createdById: payload.user_id,
          NOT: [{ transaction_id: null, track_id: null }],
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.returns_01.count({
        where: {
          deletedAt: null,
          deletedBy: null,
          dvat04Id: dvatid,
          // createdById: payload.user_id,
          NOT: [{ transaction_id: null, track_id: null }],
        },
      }),
    ]);

    if (!dvat04response)
      return createPaginationResponse({
        message: "Invalid user id. Please try again.",
        functionname,
      });

    return createPaginationResponse({
      message: "dvat04 data get successfully",
      functionname,
      data: dvat04response,
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

export default GetUserTrackPayment;
