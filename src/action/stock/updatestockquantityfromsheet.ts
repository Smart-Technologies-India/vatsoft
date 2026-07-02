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

interface StockUpdateDifference {
  stockId: number;
  commodityid: number;
  productName: string;
  packSize: number;
  oldQuantity: number;
  newQuantity: number;
  difference: number;
  newStockBottle: number;
  differenceBottle: number;
}

const UpdateStockQuantityFromSheet = async (
  payload: UpdateStockQuantityFromSheetPayload,
): Promise<
  ApiResponseType<
    {
      updatedCount: number;
      differences: StockUpdateDifference[];
    } | null
  >
> => {
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

    const result = await prisma.$transaction(async (tx) => {
      const commodityIds = [...new Set(normalizedEntries.map((x) => x.commodityid))];
      const quantityByCommodityId = new Map<number, number>(
        normalizedEntries.map((entry) => [entry.commodityid, entry.quantity]),
      );

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
          quantity: true,
          commodity_master: {
            select: {
              product_name: true,
              pack_size: true,
            },
          },
        },
      });

      const stockByCommodityId = new Map<
        number,
        {
          id: number;
          quantity: number;
          product_name: string;
          pack_size: string;
        }
      >();
      existingStockRows.forEach((row) => {
        stockByCommodityId.set(row.commodity_masterId, {
          id: row.id,
          quantity: row.quantity,
          product_name: row.commodity_master.product_name,
          pack_size: row.commodity_master.pack_size || "0",
        });
      });

      const missingCommodityIds = commodityIds.filter(
        (commodityId) => !stockByCommodityId.has(commodityId),
      );
      if (missingCommodityIds.length > 0) {
        throw new Error(
          `Stock row not found for commodity id(s): ${missingCommodityIds.join(", ")}. Do not modify the commodity IDs in the sheet. Please use the original commodity IDs from the stock list.`,
        );
      }

      const differences: StockUpdateDifference[] = commodityIds.map(
        (commodityid) => {
          const stockRow = stockByCommodityId.get(commodityid)!;
          const newQuantity = quantityByCommodityId.get(commodityid)!;
          const packSize = Number(stockRow.pack_size) || 1;
          const newStockBottle = newQuantity / packSize;
          const differenceBottle = newStockBottle - stockRow.quantity / packSize;

          return {
            stockId: stockRow.id,
            commodityid,
            productName: stockRow.product_name,
            packSize,
            oldQuantity: stockRow.quantity,
            newQuantity,
            difference: newQuantity - stockRow.quantity,
            newStockBottle,
            differenceBottle,
          };
        },
      );

      return {
        updatedCount: 0,
        differences,
      };
    });

    return createResponse({
      message: "Stock sheet preview generated. Please review and submit to apply updates.",
      functionname,
      data: result,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default UpdateStockQuantityFromSheet;
