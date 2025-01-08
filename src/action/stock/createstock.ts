"use server";
interface CreateStockPayload {
  dvatid: number;
  commodityid: number;
  quantity: number;
  tax_percent: string;
  amount: string;
  vatamount: string;
  amount_unit: string;
  createdById: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { stock } from "@prisma/client";
import prisma from "../../../prisma/database";

const CreateStock = async (
  payload: CreateStockPayload
): Promise<ApiResponseType<stock | null>> => {
  const functionname: string = CreateStock.name;

  try {
    const result: stock = await prisma.$transaction(async (prisma) => {
      const manufacturer_response = await prisma.manufacturer_purchase.create({
        data: {
          commodity_masterId: payload.commodityid,
          dvat04Id: payload.dvatid,
          quantity: payload.quantity,
          tax_percent: payload.tax_percent,
          amount_unit: payload.amount_unit,
          amount: payload.amount,
          vatamount: payload.vatamount,
          createdById: payload.createdById,
        },
      });
      if (!manufacturer_response) {
        throw new Error("Unable to create Manufacturer Purchase.");
      }
      const isstock = await prisma.stock.findFirst({
        where: {
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
          commodity_masterId: payload.commodityid,
        },
      });

      if (isstock) {
        const stock_respone = await prisma.stock.update({
          where: {
            id: isstock.id,
          },
          data: {
            quantity: payload.quantity + isstock.quantity,
            updatedById: payload.createdById,
          },
        });
        if (!stock_respone) {
          throw new Error("Unable to update stock.");
        }
        return stock_respone;
      } else {
        const stock_respone = await prisma.stock.create({
          data: {
            quantity: payload.quantity,
            commodity_masterId: payload.commodityid,
            dvat04Id: payload.dvatid,
            createdById: payload.createdById,
            status: "ACTIVE",
          },
        });

        if (!stock_respone) {
          throw new Error("Unable to create new stock.");
        }
        return stock_respone;
      }
    });
    return createResponse({
      message: "Stock created successfully.",
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

export default CreateStock;
