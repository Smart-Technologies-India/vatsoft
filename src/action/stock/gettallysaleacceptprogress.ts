"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface GetTallySaleAcceptProgressPayload {
  tallyIds: number[];
}

interface TallySaleAcceptProgress {
  total: number;
  converted: number;
}

const GetTallySaleAcceptProgress = async (
  payload: GetTallySaleAcceptProgressPayload,
): Promise<ApiResponseType<TallySaleAcceptProgress | null>> => {
  const functionname = GetTallySaleAcceptProgress.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const uniqueIds = Array.from(new Set(payload.tallyIds));

    if (uniqueIds.length === 0) {
      return createResponse({
        functionname,
        message: "No tally ids provided.",
        data: {
          total: 0,
          converted: 0,
        },
      });
    }

    const [total, converted] = await Promise.all([
      prisma.tally_sale.count({
        where: {
          id: { in: uniqueIds },
          status: "ACTIVE",
          deletedAt: null,
          dvat04Id: currentDvatId,
        },
      }),
      prisma.tally_sale.count({
        where: {
          id: { in: uniqueIds },
          status: "ACTIVE",
          deletedAt: null,
          dvat04Id: currentDvatId,
          is_converted: true,
        },
      }),
    ]);

    return createResponse({
      functionname,
      message: "Tally sale accept progress fetched.",
      data: {
        total,
        converted,
      },
    });
  } catch (e) {
    return createResponse({
      functionname,
      message: errorToString(e),
    });
  }
};

export default GetTallySaleAcceptProgress;
