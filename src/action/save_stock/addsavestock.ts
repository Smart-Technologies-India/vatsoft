"use server";

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
  payload: CreateSaveStockPayload
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = CreateSaveStock.name;

  try {
    const result = await prisma.$transaction(async (prisma) => {
      const isexist = await prisma.dvat04.findFirst({
        where: {
          id: payload.dvatid,
        },
      });

      if (!isexist) {
        throw new Error("DVAT04 not found.");
      }

      const delte_stock = await prisma.save_stock.deleteMany({
        where: {
          dvat04Id: payload.dvatid,
        },
      });

      if (!delte_stock) {
        throw new Error("Unable to delete stock.");
      }

      const first_stock = await prisma.save_stock.createMany({
        data: payload.data.map((item) => {
          return {
            commodity_masterId: item.item.id,
            quantity: item.quantity,
            dvat04Id: payload.dvatid,
            createdById: payload.createdById,
          };
        }),
      });

      if (!first_stock) {
        throw new Error("Unable to create First Stock entry.");
      }

      return first_stock;
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
