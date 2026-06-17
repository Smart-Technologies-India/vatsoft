"use server";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import RejectPurchase from "./rejectpurchase";

interface RejectAllPendingPurchasePayload {
  dvatid: number;
}

type RejectAllPendingPurchaseResult = {
  total: number;
  success: number;
  failed: number;
};

const RejectAllPendingPurchase = async (
  payload: RejectAllPendingPurchasePayload,
): Promise<ApiResponseType<RejectAllPendingPurchaseResult | null>> => {
  const functionname: string = RejectAllPendingPurchase.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "RejectAllPendingPurchase",
      } as any;
    }

    const pendingEntries = await prisma.daily_purchase.findMany({
      where: {
        dvat04Id: payload.dvatid,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        is_accept: false,
        seller_tin_number: {
          OR: [
            { tin_number: { startsWith: "25" } },
            { tin_number: { startsWith: "26" } },
          ],
        },
      },
      select: {
        id: true,
      },
    });

    if (pendingEntries.length === 0) {
      return createResponse({
        message: "No pending acceptable purchase records found.",
        functionname,
        data: {
          total: 0,
          success: 0,
          failed: 0,
        },
      });
    }

    let success = 0;
    let failed = 0;

    for (const entry of pendingEntries) {
      const rejectResponse = await RejectPurchase({ id: entry.id });
      if (rejectResponse.status && rejectResponse.data) {
        success += 1;
      } else {
        failed += 1;
      }
    }

    if (success === 0 && failed > 0) {
      return createResponse({
        message: "Unable to reject pending purchase records.",
        functionname,
      });
    }

    return createResponse({
      message: "Pending purchase records rejected successfully.",
      functionname,
      data: {
        total: pendingEntries.length,
        success,
        failed,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default RejectAllPendingPurchase;
