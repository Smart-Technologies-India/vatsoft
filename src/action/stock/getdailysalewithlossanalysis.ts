"use server";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { ApiResponseType } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { commodity_master, daily_sale } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetDailySaleWithLossAnalysisPayload {
  dvatid: number;
  startDate?: string; // Optional date filtering (ISO format: YYYY-MM-DD)
  endDate?: string;   // Optional date filtering (ISO format: YYYY-MM-DD)
}

export type DailySaleWithLossAnalysis = daily_sale & {
  commodity_master: commodity_master;
};

const GetDailySaleWithLossAnalysis = async (
  payload: GetDailySaleWithLossAnalysisPayload,
): Promise<ApiResponseType<DailySaleWithLossAnalysis[] | null>> => {
  const functionname: string = GetDailySaleWithLossAnalysis.name;
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

    // Build where condition with optional date filtering
    const whereCondition: any = {
      dvat04Id: payload.dvatid,
      status: "ACTIVE",
      deletedAt: null,
      deletedById: null,
    };

    // Apply optional date range filtering
    if (payload.startDate || payload.endDate) {
      const dateFilter: any = {};
      if (payload.startDate) {
        dateFilter.gte = new Date(payload.startDate);
      }
      if (payload.endDate) {
        dateFilter.lt = new Date(payload.endDate);
      }
      whereCondition.invoice_date = dateFilter;
    }

    // Fetch all daily sales data in batches to handle large datasets
    const batchSize = 5000;
    let allDailySalesData: DailySaleWithLossAnalysis[] = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = await prisma.daily_sale.findMany({
        where: whereCondition,
        include: {
          commodity_master: true,
        },
        orderBy: {
          invoice_date: "asc",
        },
        take: batchSize,
        skip: skip,
      });

      if (batch.length === 0) {
        hasMore = false;
      } else {
        allDailySalesData = allDailySalesData.concat(batch);
        skip += batchSize;
      }
    }

    return {
      status: true,
      data: allDailySalesData,
      message: `Daily sales data fetched successfully (${allDailySalesData.length} records)`,
      functionname,
    };
  } catch (e) {
    return {
      status: false,
      data: null,
      message: errorToString(e),
      functionname,
    };
  }
};

export default GetDailySaleWithLossAnalysis;
