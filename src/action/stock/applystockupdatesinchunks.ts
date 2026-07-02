"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface ApplyStockUpdatesPayload {
  dvatid: number;
  entries: Array<{
    commodityid: number;
    quantity: number;
  }>;
}

interface ChunkUpdateResult {
  processedCount: number;
  totalCount: number;
  currentChunk: number;
  totalChunks: number;
}

const ApplyStockUpdatesInChunks = async (
  payload: ApplyStockUpdatesPayload,
): Promise<
  ApiResponseType<
    {
      processedCount: number;
      failedCount: number;
      message: string;
    } | null
  >
> => {
  const functionname: string = ApplyStockUpdatesInChunks.name;

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
        message: "Invalid commodity or quantity values.",
        functionname,
      });
    }

    const commodityIds = [...new Set(normalizedEntries.map((x) => x.commodityid))];
    const quantityByCommodityId = new Map<number, number>(
      normalizedEntries.map((entry) => [entry.commodityid, entry.quantity]),
    );

    // Fetch all stock rows upfront
    const existingStockRows = await prisma.stock.findMany({
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
      },
    });

    const stockByCommodityId = new Map<
      number,
      {
        id: number;
        quantity: number;
      }
    >();
    existingStockRows.forEach((row) => {
      stockByCommodityId.set(row.commodity_masterId, {
        id: row.id,
        quantity: row.quantity,
      });
    });

    const missingCommodityIds = commodityIds.filter(
      (commodityId) => !stockByCommodityId.has(commodityId),
    );
    if (missingCommodityIds.length > 0) {
      return createResponse({
        message: `Stock row not found for commodity id(s): ${missingCommodityIds.join(", ")}`,
        functionname,
      });
    }

    // Process in chunks of 100
    const CHUNK_SIZE = 100;
    let processedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < normalizedEntries.length; i += CHUNK_SIZE) {
      const chunk = normalizedEntries.slice(
        i,
        Math.min(i + CHUNK_SIZE, normalizedEntries.length),
      );

      await prisma.$transaction(async (tx) => {
        for (const entry of chunk) {
          const stockRow = stockByCommodityId.get(entry.commodityid);
          if (!stockRow) {
            failedCount++;
            continue;
          }

          try {
            // Insert snapshot
            await tx.$executeRaw`
              INSERT INTO stock_update_snapshot
                (dvat04Id, stockId, commodity_masterId, old_quantity, new_quantity, source, createdById, createdAt)
              VALUES
                (${payload.dvatid}, ${stockRow.id}, ${entry.commodityid}, ${stockRow.quantity}, ${entry.quantity}, ${"UPLOAD_STOCK_SHEET"}, ${currentUserId}, NOW())
            `;

            // Update stock
            await tx.stock.update({
              where: {
                id: stockRow.id,
              },
              data: {
                quantity: entry.quantity,
                updatedById: currentUserId,
              },
            });

            processedCount++;
          } catch {
            failedCount++;
          }
        }
      });
    }

    return createResponse({
      message: `Stock updated successfully. Processed: ${processedCount}, Failed: ${failedCount}`,
      functionname,
      data: {
        processedCount,
        failedCount,
        message: `Updated ${processedCount} rows in ${Math.ceil(normalizedEntries.length / CHUNK_SIZE)} batches`,
      },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default ApplyStockUpdatesInChunks;

function errorToString(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
