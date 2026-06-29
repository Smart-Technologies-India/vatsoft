"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { refinery_sale } from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface ChangeRefinerySalesPayload {
  refineryId: number;
  refinerysaleId: number;
}

const ChangeRefinerySales = async (
  payload: ChangeRefinerySalesPayload,
): Promise<ApiResponseType<refinery_sale | null>> => {
  const functionname = ChangeRefinerySales.name;

  try {
    const currentUserId = await getCurrentUserId();

    const refinerySale = await prisma.refinery_sale.findFirst({
      where: {
        id: payload.refinerysaleId,
        deletedAt: null,
        refinery_status: "VATPAID",
        status: "ACTIVE",
      },
    });

    if (!refinerySale) {
      return createResponse({
        functionname,
        message: "Refinery sale not found or not in VATPAID status.",
      });
    }

    if (refinerySale.refineryId === payload.refineryId) {
      return createResponse({
        functionname,
        message: "Selected refinery is already assigned to this sale.",
        data: refinerySale,
      });
    }

    const updatedata = await prisma.$transaction(async (tx) => {
      const oldStockAggregate = await tx.refinery_sale.aggregate({
        _sum: {
          quantity: true,
        },
        where: {
          refineryId: refinerySale.refineryId,
          commodity_masterId: refinerySale.commodity_masterId,
          refinery_status: "VATPAID",
          status: "ACTIVE",
          deletedAt: null,
        },
      });

      const newStockAggregate = await tx.refinery_sale.aggregate({
        _sum: {
          quantity: true,
        },
        where: {
          refineryId: payload.refineryId,
          commodity_masterId: refinerySale.commodity_masterId,
          refinery_status: "VATPAID",
          status: "ACTIVE",
          deletedAt: null,
        },
      });

      const oldStock = Number(oldStockAggregate._sum.quantity || 0);
      const newStock = Number(newStockAggregate._sum.quantity || 0);
      const oldStockAfter = Math.max(0, oldStock - refinerySale.quantity);
      const newStockAfter = newStock + refinerySale.quantity;

      const updatedSale = await tx.refinery_sale.update({
        where: {
          id: payload.refinerysaleId,
        },
        data: {
          refineryId: payload.refineryId,
          ...(currentUserId ? { updatedById: currentUserId } : {}),
        },
      });

      await tx.refinery_sale_change_log.create({
        data: {
          refinery_sale_id: refinerySale.id,
          old_refinery_id: refinerySale.refineryId,
          new_refinery_id: payload.refineryId,
          old_stock: oldStock,
          new_stock: newStock,
          old_stock_after: oldStockAfter,
          new_stock_after: newStockAfter,
          commodity_master_id: refinerySale.commodity_masterId,
          seller_tin_number_id: refinerySale.seller_tin_numberId,
          invoice_number: refinerySale.invoice_number,
          invoice_date: refinerySale.invoice_date,
          quantity: refinerySale.quantity,
          amount_unit: refinerySale.amount_unit,
          refinery_status_before: refinerySale.refinery_status,
          refinery_status_after: updatedSale.refinery_status,
          createdById: currentUserId || null,
        },
      });

      return updatedSale;
    });

    if (!updatedata) {
      return createResponse({
        functionname,
        message: "Failed to update refinery sale.",
      });
    }

    return {
      status: true,
      data: updatedata,
      message: "Refinery updated successfully.",
      functionname,
    };
  } catch (error) {
    return {
      status: false,
      data: null,
      message: errorToString(error),
      functionname,
    };
  }
};

export default ChangeRefinerySales;
