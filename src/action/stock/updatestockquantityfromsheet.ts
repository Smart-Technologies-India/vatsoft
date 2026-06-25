"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface UpdateStockQuantityFromSheetPayload {
  dvatid: number;
  entries: Array<{
    commodityid: number;
    quantity: number;
  }>;
}

const UpdateStockQuantityFromSheet = async (
  payload: UpdateStockQuantityFromSheetPayload,
): Promise<ApiResponseType<{ updatedCount: number } | null>> => {
  const functionname: string = UpdateStockQuantityFromSheet.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "UpdateStockQuantityFromSheet",
      } as any;
    }

    if (payload.dvatid !== currentDvatId) {
      return createResponse({
        message: "Invalid dealer context.",
        functionname,
      });
    }

    if (!payload.entries || payload.entries.length === 0) {
      return createResponse({
        message: "No stock rows found to update.",
        functionname,
      });
    }

    const normalizedEntries = payload.entries.map((entry) => ({
      commodityid: Number(entry.commodityid),
      quantity: Math.trunc(Number(entry.quantity)),
    }));

    if (
      normalizedEntries.some(
        (entry) =>
          !Number.isFinite(entry.commodityid) ||
          entry.commodityid <= 0 ||
          !Number.isFinite(entry.quantity) ||
          entry.quantity < 0,
      )
    ) {
      return createResponse({
        message: "Invalid commodity or quantity values in sheet.",
        functionname,
      });
    }

    const updatedCount = await prisma.$transaction(async (tx) => {
      const commodityIds = [...new Set(normalizedEntries.map((x) => x.commodityid))];

      const existingStockRows = await tx.stock.findMany({
        where: {
          dvat04Id: payload.dvatid,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          commodity_masterId: {
            in: commodityIds,
          },
        },
        select: {
          id: true,
          commodity_masterId: true,
        },
      });

      const stockByCommodityId = new Map<number, { id: number }>();
      existingStockRows.forEach((row) => {
        stockByCommodityId.set(row.commodity_masterId, { id: row.id });
      });

      for (const entry of normalizedEntries) {
        const stockRow = stockByCommodityId.get(entry.commodityid);
        if (!stockRow) {
          throw new Error(
            `Stock row not found for commodity id ${entry.commodityid}.`,
          );
        }

        await tx.stock.update({
          where: {
            id: stockRow.id,
          },
          data: {
            quantity: entry.quantity,
            updatedById: currentUserId,
          },
        });
      }

      return normalizedEntries.length;
    });

    return createResponse({
      message: "Stock quantities updated successfully.",
      functionname,
      data: {
        updatedCount,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default UpdateStockQuantityFromSheet;
