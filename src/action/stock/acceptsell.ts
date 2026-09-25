"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface AcceptSalePayload {
  dvatid: number;
  commodityid: number;
  quantity: number;
  puchaseid: number;
  urn: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { daily_purchase } from "@prisma/client";
import prisma from "../../../prisma/database";

const AcceptSale = async (
  payload: AcceptSalePayload,
): Promise<ApiResponseType<daily_purchase | null>> => {
  const functionname: string = AcceptSale.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AcceptSale",
      } as any;
    }

    const result = await prisma.$transaction(async (prisma) => {
      const isstock = await prisma.stock.findFirst({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
          commodity_masterId: payload.commodityid,
        },
      });

      if (!isstock) {
        throw new Error("Stock not found");
      }

      const stock_respone = await prisma.stock.upsert({
        where: {
          id: isstock.id,
        },
        update: {
          quantity: payload.quantity + isstock.quantity,
          updatedById: currentUserId,
        },
        create: {
          quantity: payload.quantity,
          commodity_masterId: payload.commodityid,
          dvat04Id: payload.dvatid,
          createdById: currentUserId,
          status: "ACTIVE",
        },
      });

      if (!stock_respone) {
        throw new Error("Unable to update or create stock.");
      }

      const purchase_update = await prisma.daily_purchase.update({
        where: {
          id: payload.puchaseid,
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
        data: {
          is_accept: true,
        },
      });

      if (!purchase_update) {
        throw new Error("Unable to update daily purchase");
      }

      const sale_udpate = await prisma.daily_sale.updateMany({
        where: {
          urn_number: purchase_update.urn_number,
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
        data: {
          is_accept: true,
        },
      });

      if (!sale_udpate) {
        throw new Error("Unable to update sale");
      }

      return purchase_update;
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
