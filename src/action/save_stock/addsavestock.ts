"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master } from "@prisma/client";
import prisma from "../../../prisma/database";

interface StockData {
  item: commodity_master;
  quantity: number;
}

interface CreateSaveStockPayload {
  data: StockData[];
  dvatid: number;
  createdById: number;
}

const CreateSaveStock = async (
  payload: CreateSaveStockPayload,
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = CreateSaveStock.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "CreateSaveStock",
      } as any;
    }

    await prisma.$transaction(async (prisma) => {
      const isexist = await prisma.dvat04.findFirst({
        where: {
          id: payload.dvatid,
        },
      });

      if (!isexist) {
        throw new Error("DVAT04 not found.");
      }

      const incomingStockByCommodity = new Map<number, number>();
      for (const stock of payload.data) {
        incomingStockByCommodity.set(stock.item.id, stock.quantity);
      }

      const existingStocks = await prisma.save_stock.findMany({
        where: {
          dvat04Id: payload.dvatid,
          deletedAt: null,
        },
        select: {
          id: true,
          commodity_masterId: true,
          quantity: true,
        },
      });

      const existingByCommodity = new Map<
        number,
        { id: number; quantity: number }
      >();
      const duplicateIdsToDelete: number[] = [];

      for (const stock of existingStocks) {
        if (!existingByCommodity.has(stock.commodity_masterId)) {
          existingByCommodity.set(stock.commodity_masterId, {
            id: stock.id,
            quantity: stock.quantity,
          });
          continue;
        }

        // If duplicate rows already exist for the same commodity, keep one and clean extras.
        duplicateIdsToDelete.push(stock.id);
      }

      const commodityIdsFromPayload = Array.from(
        incomingStockByCommodity.keys(),
      );

      const commoditiesToCreate = commodityIdsFromPayload.filter(
        (commodityId) => !existingByCommodity.has(commodityId),
      );

      const stocksToUpdate = commodityIdsFromPayload.filter((commodityId) => {
        const existingStock = existingByCommodity.get(commodityId);
        if (!existingStock) {
          return false;
        }

        return (
          existingStock.quantity !== incomingStockByCommodity.get(commodityId)
        );
      });

      const staleStockIdsToDelete = existingStocks
        .filter(
          (stock) =>
            !incomingStockByCommodity.has(stock.commodity_masterId) &&
            !duplicateIdsToDelete.includes(stock.id),
        )
        .map((stock) => stock.id);

      if (commoditiesToCreate.length > 0) {
        await prisma.save_stock.createMany({
          data: commoditiesToCreate.map((commodityId) => ({
            commodity_masterId: commodityId,
            quantity: incomingStockByCommodity.get(commodityId) ?? 0,
            dvat04Id: payload.dvatid,
            createdById: payload.createdById,
          })),
        });
      }

      if (stocksToUpdate.length > 0) {
        await Promise.all(
          stocksToUpdate.map((commodityId) => {
            const existingStock = existingByCommodity.get(commodityId);

            if (!existingStock) {
              return Promise.resolve();
            }

            return prisma.save_stock.update({
              where: {
                id: existingStock.id,
              },
              data: {
                quantity: incomingStockByCommodity.get(commodityId) ?? 0,
                updatedById: payload.createdById,
              },
            });
          }),
        );
      }

      const idsToDelete = [...duplicateIdsToDelete, ...staleStockIdsToDelete];
      if (idsToDelete.length > 0) {
        await prisma.save_stock.updateMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
          data: {
            deletedAt: new Date(),
            updatedById: payload.createdById,
          },
        });
      }
    });

    return createResponse({
      message: "Stock Saved successfully.",
      functionname,
      data: true,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateSaveStock;
