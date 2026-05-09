"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface GetPendingAcceptCountPayload {
  dvatid: number;
}

const GetPendingAcceptCount = async (
  payload: GetPendingAcceptCountPayload,
): Promise<{ status: boolean; data: number; message: string }> => {
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetPendingAcceptCount",
      } as any;
    }

    const count = await prisma.daily_purchase.count({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        is_dvat_30a: false,
        dvat04Id: payload.dvatid,
        is_accept: false,
      },
    });

    // Filter in-memory for TINs starting with 25 or 26 (startsWith "2" is a rough filter,
    // but Prisma doesn't support OR startsWith natively for all adapters, so use raw count approach)
    const records = await prisma.daily_purchase.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        is_dvat_30a: false,
        dvat04Id: payload.dvatid,
        is_accept: false,
      },
      select: {
        seller_tin_number: {
          select: { tin_number: true },
        },
      },
    });

    const pendingCount = records.filter(
      (r) =>
        r.seller_tin_number.tin_number.startsWith("25") ||
        r.seller_tin_number.tin_number.startsWith("26"),
    ).length;

    return { status: true, data: pendingCount, message: "" };
  } catch (error) {
    return { status: false, data: 0, message: errorToString(error) };
  }
};

export default GetPendingAcceptCount;
