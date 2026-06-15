"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface GetCommodityOpeningStockSummaryPayload {
  dvat04Id: number;
  commodityMasterId: number;
}

export interface CommodityOpeningStockSummary {
  firstStockQuantity: number;
  stockQuantity: number;
  existsInDailySale: boolean;
  existsInDailyPurchase: boolean;
}

const GetCommodityOpeningStockSummary = async (
  payload: GetCommodityOpeningStockSummaryPayload,
): Promise<ApiResponseType<CommodityOpeningStockSummary | null>> => {
  const functionname = GetCommodityOpeningStockSummary.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      };
    }

    if (!payload.dvat04Id || !payload.commodityMasterId) {
      return createResponse({
        message: "Invalid dealer or commodity.",
        functionname,
      });
    }

    const [firstStockAggregate, stockAggregate, dailySaleCount, dailyPurchaseCount] =
      await Promise.all([
        prisma.first_stock.aggregate({
          where: {
            dvat04Id: payload.dvat04Id,
            commodity_masterId: payload.commodityMasterId,
            deletedAt: null,
            status: "ACTIVE",
          },
          _sum: {
            quantity: true,
          },
        }),
        prisma.stock.aggregate({
          where: {
            dvat04Id: payload.dvat04Id,
            commodity_masterId: payload.commodityMasterId,
            deletedAt: null,
            status: "ACTIVE",
          },
          _sum: {
            quantity: true,
          },
        }),
        prisma.daily_sale.count({
          where: {
            dvat04Id: payload.dvat04Id,
            commodity_masterId: payload.commodityMasterId,
            deletedAt: null,
            status: "ACTIVE",
          },
        }),
        prisma.daily_purchase.count({
          where: {
            dvat04Id: payload.dvat04Id,
            commodity_masterId: payload.commodityMasterId,
            deletedAt: null,
            status: "ACTIVE",
          },
        }),
      ]);

    return createResponse({
      message: "Commodity opening stock summary fetched successfully.",
      functionname,
      data: {
        firstStockQuantity: firstStockAggregate._sum.quantity ?? 0,
        stockQuantity: stockAggregate._sum.quantity ?? 0,
        existsInDailySale: dailySaleCount > 0,
        existsInDailyPurchase: dailyPurchaseCount > 0,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetCommodityOpeningStockSummary;
