"use server";
interface AcceptSalePayload {
  dvatid: number;
  commodityid: number;
  createdById: number;
  quantity: number;
  puchaseid: number;
  urn: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { daily_purchase, stock } from "@prisma/client";
import prisma from "../../../prisma/database";

const AcceptSale = async (
  payload: AcceptSalePayload
): Promise<ApiResponseType<daily_purchase | null>> => {
  const functionname: string = AcceptSale.name;

  try {
    const result = await prisma.$transaction(async (prisma) => {
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
      }

      const is_purchase = await prisma.daily_purchase.findFirst({
        where: {
          id: payload.puchaseid,
          status: "ACTIVE",
        },
      });

      if (!is_purchase) {
        throw new Error("Unable to find daily purchase");
      }
      const purchase_update = await prisma.daily_purchase.update({
        where: {
          id: is_purchase.id,
        },
        data: {
          is_accept: true,
        },
      });

      if (!purchase_update) {
        throw new Error("Unable to update daily purchase");
      }
      const is_sale = await prisma.daily_sale.findFirst({
        where: {
          urn_number: is_purchase.urn_number,
          status: "ACTIVE",
        },
      });

      if (!is_sale) {
        throw new Error("Sale not found");
      }

      const sale_udpate = await prisma.daily_sale.update({
        where: {
          id: is_sale.id,
        },
        data: {
          is_accept: true,
        },
      });

      if (!sale_udpate) {
        throw new Error("Unable to update sale");
      }

      return is_purchase;
    });

    return createResponse({
      message: "Daily Sale Created successfully",
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

export default AcceptSale;
