"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface PendingAcceptStatus {
  pendingPurchaseCount: number;
  pendingSaleCount: number;
  hasPending: boolean;
}

const GetPendingAcceptStatus = async (): Promise<{
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

    const [pendingPurchaseCount, pendingSaleCount] = await Promise.all([
      prisma.daily_purchase.count({
        where: {
          dvat04Id: currentDvatId,
          is_accept: false,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
        },
      }),
      prisma.daily_sale.count({
        where: {
          dvat04Id: currentDvatId,
          is_accept: false,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
        },
      }),
    ]);

    const data: PendingAcceptStatus = {
      pendingPurchaseCount,
      pendingSaleCount,
      hasPending: pendingPurchaseCount > 0 || pendingSaleCount > 0,
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