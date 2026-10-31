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
      // Fetch purchase record first to get URN for later use
      const purchase = await prisma.daily_purchase.findUnique({
        where: {
          id: payload.puchaseid,
        },
        select: {
          id: true,
          urn_number: true,
          status: true,
          deletedAt: true,
          deletedById: true,
        },
      });

      if (
        !purchase ||
        purchase.status !== "ACTIVE" ||
        purchase.deletedAt ||
        purchase.deletedById
      ) {
        throw new Error("Unable to find daily purchase");
      }

      // Get current stock quantity in a single query using findUnique on unique constraint
      const stock = await prisma.stock.findFirst({
        where: {
          dvat04Id: payload.dvatid,
          commodity_masterId: payload.commodityid,
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
        select: {
          id: true,
          quantity: true,
        },
      });

      const newQuantity = payload.quantity + (stock?.quantity || 0);

      // Update or create stock with calculated quantity
      let stock_response;
      if (stock) {
        stock_response = await prisma.stock.update({
          where: { id: stock.id },
          data: {
            quantity: newQuantity,
            updatedById: currentUserId,
          },
        });
      } else {
        stock_response = await prisma.stock.create({
          data: {
            quantity: newQuantity,
            commodity_masterId: payload.commodityid,
            dvat04Id: payload.dvatid,
            createdById: currentUserId,
            status: "ACTIVE",
          },
        });
      }

      if (!stock_response) {
        throw new Error("Unable to update or create stock.");
      }

      // Update purchase and sales sequentially
      const purchase_update = await prisma.daily_purchase.update({
        where: { id: payload.puchaseid },
        data: { is_accept: true },
      });

      if (!purchase_update) {
        throw new Error("Unable to update daily purchase");
      }

      const sale_update = await prisma.daily_sale.updateMany({
        where: {
          urn_number: purchase.urn_number,
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
        data: { is_accept: true },
      });

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
