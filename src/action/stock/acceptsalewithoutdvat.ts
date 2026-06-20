"use server";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { daily_sale } from "@prisma/client";
import prisma from "../../../prisma/database";

interface AcceptSaleWithoutDvatPayload {
  saleId: number;
}

const AcceptSaleWithoutDvat = async (
  payload: AcceptSaleWithoutDvatPayload,
): Promise<ApiResponseType<daily_sale | null>> => {
  const functionname: string = AcceptSaleWithoutDvat.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AcceptSaleWithoutDvat",
      } as any;
    }

    const sale = await prisma.daily_sale.findFirst({
      where: {
        id: payload.saleId,
        dvat04Id: currentDvatId,
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!sale) {
      return createResponse({
        message: "Sale record not found.",
        functionname,
      });
    }

    const updatedSale = await prisma.daily_sale.update({
      where: {
        id: sale.id,
      },
      data: {
        is_accept: true,
        updatedById: currentUserId,
      },
    });

    return createResponse({
      message: "Sale record accepted successfully.",
      functionname,
      data: updatedSale,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AcceptSaleWithoutDvat;
