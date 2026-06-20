"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { daily_sale } from "@prisma/client";
import prisma from "../../../prisma/database";

interface ReverseSaleAcceptPayload {
  saleId: number;
  updatedById: number;
}

const ReverseSaleAccept = async (
  payload: ReverseSaleAcceptPayload,
): Promise<ApiResponseType<daily_sale | null>> => {
  const functionname: string = ReverseSaleAccept.name;

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
      const sale = await tx.daily_sale.findFirst({
        where: {
          id: payload.saleId,
          dvat04Id: currentDvatId,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          is_dvat_31: false,
          seller_tin_number: {
            deletedAt: null,
            status: "ACTIVE",
            dvat04: {
              none: {
                deletedAt: null,
                deletedBy: null,
              },
            },
          },
        },
      });

      if (!sale) {
        throw new Error("Sale row not found or not eligible for reverse.");
      }

      const stockRow = await tx.stock.findFirst({
        where: {
          dvat04Id: sale.dvat04Id,
          commodity_masterId: sale.commodity_masterId,
          deletedAt: null,
          status: "ACTIVE",
        },
      });

      if (!stockRow) {
        throw new Error("Stock row not found for this commodity.");
      }

      await tx.stock.update({
        where: {
          id: stockRow.id,
        },
        data: {
          quantity: stockRow.quantity + sale.quantity,
          updatedById: payload.updatedById,
        },
      });

      const updatedSale = await tx.daily_sale.update({
        where: {
          id: sale.id,
        },
        data: {
          is_accept: false,
        },
      });

      return updatedSale;
    });

    return createResponse({
      message: "Sale reversed successfully.",
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

export default ReverseSaleAccept;
