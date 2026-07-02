"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface PendingAcceptStatus {
  pendingPurchaseCount: number;
  hasPending: boolean;
}

interface GetPendingAcceptStatusPayload {
  fromDate?: Date;
  toDate?: Date;
}

const GetPendingAcceptStatus = async (
  payload?: GetPendingAcceptStatusPayload,
): Promise<{
  status: boolean;
  data: PendingAcceptStatus | null;
  message: string;
}> => {
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
      };
    }

    const invoiceDateFilter =
      payload?.fromDate && payload?.toDate
        ? {
            invoice_date: {
              gte: payload.fromDate,
              lte: payload.toDate,
            },
          }
        : {};

    const pendingPurchaseCount = await prisma.daily_purchase.count({
      where: {
        dvat04Id: currentDvatId,
        is_accept: false,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        ...invoiceDateFilter,
      },
    });

    const data: PendingAcceptStatus = {
      pendingPurchaseCount,
      hasPending: pendingPurchaseCount > 0,
    };

    return {
      status: true,
      data,
      message: "",
    };
  } catch (error) {
    return {
      status: false,
      data: null,
      message: errorToString(error),
    };
  }
};

export default GetPendingAcceptStatus;
