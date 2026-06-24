"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { daily_sale } from "@prisma/client";
import prisma from "../../../prisma/database";

interface AcceptSaleForPendingProcessPayload {
  saleId: number;
}


const  AcceptSaleForPendingProcess = async (
  payload: AcceptSaleForPendingProcessPayload,
): Promise<ApiResponseType<daily_sale | null>> => {
  const functionname: string = AcceptSaleForPendingProcess.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AcceptSaleForPendingProcess",
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
      include: {
        seller_tin_number: {
          select: {
            tin_number: true,
          },
        },
      },
    });

    if (!sale) {
      return createResponse({
        message: "Sale record not found.",
        functionname,
      });
    }

    const sellerTin = sale.seller_tin_number?.tin_number?.trim();
    if (!sellerTin) {
      return createResponse({
        message: "Seller DVAT status is not pendingprocess.",
        functionname,
      });
    }

    const sellerDvat = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        tinNumber: sellerTin,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        status: true,
      },
    });

    const sellerStatus = (sellerDvat?.status ?? "").toUpperCase();
    if (sellerStatus !== "PENDINGPROCESS") {
      return createResponse({
        message: "Seller DVAT status is not pendingprocess.",
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


export default AcceptSaleForPendingProcess;
