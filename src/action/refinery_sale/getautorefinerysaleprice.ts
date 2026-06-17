"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { isValid, parse } from "date-fns";

interface GetAutoRefinerySalePricePayload {
  refineryId: number;
  commodityMasterId: number;
  invoiceDate: string;
}

const GetAutoRefinerySalePrice = async (
  payload: GetAutoRefinerySalePricePayload,
): Promise<ApiResponseType<number | null>> => {
  const functionname = GetAutoRefinerySalePrice.name;

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

    if (!payload.refineryId || payload.refineryId <= 0) {
      return createResponse({
        functionname,
        message: "Refinery is required.",
      });
    }

    if (!payload.commodityMasterId || payload.commodityMasterId <= 0) {
      return createResponse({
        functionname,
        message: "Commodity is required.",
      });
    }

    const invoiceDate = parse(payload.invoiceDate, "dd/MM/yyyy", new Date());
    if (!isValid(invoiceDate)) {
      return createResponse({
        functionname,
        message: "Invalid invoice date. Use dd/MM/yyyy format.",
      });
    }

    const scopedPrice = await prisma.refinery_price.findFirst({
      where: {
        refineryId: payload.refineryId,
        dvatid: currentDvatId,
        commodity_masterId: payload.commodityMasterId,
        deletedAt: null,
        status: "ACTIVE",
        effective_date: {
          lte: invoiceDate,
        },
      },
      orderBy: {
        effective_date: "desc",
      },
      select: {
        price: true,
      },
    });

    const fallbackPrice = await prisma.refinery_price.findFirst({
      where: {
        refineryId: payload.refineryId,
        dvatid: null,
        commodity_masterId: payload.commodityMasterId,
        deletedAt: null,
        status: "ACTIVE",
        effective_date: {
          lte: invoiceDate,
        },
      },
      orderBy: {
        effective_date: "desc",
      },
      select: {
        price: true,
      },
    });

    const finalPrice =
      scopedPrice?.price ?? fallbackPrice?.price ?? "0";

    return createResponse({
      functionname,
      message: "Auto price resolved successfully.",
      data: Number.parseFloat(finalPrice) || 0,
    });
  } catch (error) {
    return createResponse({
      functionname,
      message: errorToString(error),
    });
  }
};

export default GetAutoRefinerySalePrice;
