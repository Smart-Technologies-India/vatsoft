"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master, stock } from "@prisma/client";
import prisma from "../../../prisma/database";

interface StockData {
  item: commodity_master;
  quantity: number;
}

interface CreateStockPayload {
  data: StockData[];
  dvatid: number;
  createdById: number;
}

const CreateFirstStock = async (
  payload: CreateStockPayload
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = CreateFirstStock.name;

  try {
    const result = await prisma.$transaction(async (prisma) => {
      const first_stock = await prisma.first_stock.createMany({
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

      const stocks = await prisma.stock.createMany({
        data: payload.data.map((item) => {
          return {
            quantity: item.quantity,
            commodity_masterId: item.item.id,
            dvat04Id: payload.dvatid,
            createdById: payload.createdById,
            status: "ACTIVE",
          };
        }),
      });

      if (!stocks) {
        throw new Error("Unable to create stock entry.");
      }

      return stocks;
    });
    return createResponse({
      message: "Stock created successfully.",
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

export default CreateFirstStock;
