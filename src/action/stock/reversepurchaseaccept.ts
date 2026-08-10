"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { daily_purchase } from "@prisma/client";
import prisma from "../../../prisma/database";

interface ReversePurchaseAcceptPayload {
  purchaseId: number;
  updatedById: number;
}

const ReversePurchaseAccept = async (
  payload: ReversePurchaseAcceptPayload,
): Promise<ApiResponseType<daily_purchase | null>> => {
  const functionname: string = ReversePurchaseAccept.name;

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

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.daily_purchase.findFirst({
        where: {
          id: payload.purchaseId,
          dvat04Id: currentDvatId,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          is_accept: true,
          is_dvat_30a: false,
        },
        include: {
          dvat04: true,
        },
      });

      if (!purchase) {
        throw new Error("Purchase row not found or not eligible for reverse.");
      }

      const stockRow = await tx.stock.findFirst({
        where: {
          dvat04Id: purchase.dvat04Id,
          commodity_masterId: purchase.commodity_masterId,
          deletedAt: null,
          status: "ACTIVE",
        },
        include: {
          commodity_master: true,
        },
      });

      if (!stockRow) {
        throw new Error("Stock row not found for this commodity.");
      }

      const packSize = parseFloat(stockRow.commodity_master?.pack_size || "1");
      const requiredPcs =
        purchase.dvat04.commodity == "RESTAURANT"
          ? Math.ceil(purchase.quantity * packSize)
          : purchase.quantity;

      if (stockRow.quantity < requiredPcs) {
        const availableQuantity = stockRow.quantity;
        throw new Error(
          `Insufficient stock to reverse. Available: ${availableQuantity}, Required: ${purchase.quantity}.`,
        );
      }

      await tx.stock.update({
        where: {
          id: stockRow.id,
        },
        data: {
          quantity: stockRow.quantity - requiredPcs,
          updatedById: payload.updatedById,
        },
      });

      const updatedPurchase = await tx.daily_purchase.update({
        where: {
          id: purchase.id,
        },
        data: {
          is_accept: false,
          updatedById: payload.updatedById,
        },
      });

      const updateSale = await tx.daily_sale.updateMany({
        where: {
          urn_number: purchase.urn_number,
          deletedAt: null,
          deletedById: null,
        },
        data: {
          is_accept: false,
          updatedById: payload.updatedById,
        },
      });

      return updatedPurchase;
    });

    return createResponse({
      message: "Purchase reversed successfully.",
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

export default ReversePurchaseAccept;
