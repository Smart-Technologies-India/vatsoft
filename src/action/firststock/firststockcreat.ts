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
      const isexist = await prisma.dvat04.findFirst({
        where: {
          id: payload.dvatid,
        },
      });

      if (!isexist) {
        throw new Error("DVAT04 not found.");
      }

      const update_dvat = await prisma.dvat04.update({
        where: {
          id: payload.dvatid,
        },
        data: {
          status: "APPROVED",
        },
      });
      if (!update_dvat) {
        throw new Error("Unable to update DVAT04.");
      }

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

      // Handle stock creation/update for each item
      for (const item of payload.data) {
        const existingStock = await prisma.stock.findFirst({
          where: {
            commodity_masterId: item.item.id,
            dvat04Id: payload.dvatid,
          },
        });

        if (existingStock) {
          // Update existing stock quantity
          await prisma.stock.update({
            where: {
              id: existingStock.id,
            },
            data: {
              quantity: existingStock.quantity + item.quantity,
            },
          });
        } else {
          // Create new stock entry
          await prisma.stock.create({
            data: {
              quantity: item.quantity,
              commodity_masterId: item.item.id,
              dvat04Id: payload.dvatid,
              createdById: payload.createdById,
              status: "ACTIVE",
            },
          });
        }
      }

      return true;
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
