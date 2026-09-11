"use server";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { ApiResponseType } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { commodity_master, daily_sale } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetDailySaleWithLossAnalysisPayload {
  dvatid: number;
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

    const dailySalesData = await prisma.daily_sale.findMany({
      where: {
        dvat04Id: payload.dvatid,
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
      },
      include: {
        commodity_master: true,
      },
      orderBy: {
        invoice_date: "asc",
      },
      take: 10000,
    });

    return {
      status: true,
      data: dailySalesData,
      message: "Daily sales data fetched successfully",
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
