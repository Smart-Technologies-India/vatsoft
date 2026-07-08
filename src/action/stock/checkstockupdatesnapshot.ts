"use server";

import { errorToString } from "@/utils/methods";
import { stock_update_snapshot } from "@prisma/client";
import prisma from "../../../prisma/database";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

interface CheckStockUpdateSnapshotResponse {
  status: boolean;
  data: stock_update_snapshot[] | null;
  exists: boolean;
  count: number;
  message: string;
  functionname: string;
}

interface CheckStockUpdateSnapshotPayload {
  dvatid?: number;
}

const CheckStockUpdateSnapshot = async (
  payload?: CheckStockUpdateSnapshotPayload,
): Promise<CheckStockUpdateSnapshotResponse> => {
  const functionname: string = CheckStockUpdateSnapshot.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        exists: false,
        count: 0,
        message: "Not authenticated. Please login.",
        functionname,
      };
    }

    const dvatId = payload?.dvatid || currentDvatId;

    // Get all snapshot data for the user and dvat04
    const snapshotData = await prisma.stock_update_snapshot.findMany({
      where: {
        dvat04Id: dvatId,
        createdById: currentUserId,
      },
      include: {
        commodity_master: true,
        stock: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const snapshotCount = await prisma.stock_update_snapshot.count({
      where: {
        dvat04Id: dvatId,
        createdById: currentUserId,
      },
    });

    const exists = snapshotCount > 0;

    return {
      status: true,
      data: exists ? snapshotData : null,
      exists,
      count: snapshotCount,
      message: exists
        ? `Found ${snapshotCount} stock update snapshot records`
        : "No stock update snapshot records found",
      functionname,
    };
  } catch (e) {
    return {
      status: false,
      data: null,
      exists: false,
      count: 0,
      message: errorToString(e),
      functionname,
    };
  }
};

export default CheckStockUpdateSnapshot;
