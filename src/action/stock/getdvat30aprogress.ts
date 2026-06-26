"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface GetDvat30AProgressPayload {
  dvatid: number;
  startDate?: string;
  endDate?: string;
}

interface Dvat30AProgress {
  totalInRange: number;
  convertedInRange: number;
}

const GetDvat30AProgress = async (
  payload: GetDvat30AProgressPayload,
): Promise<ApiResponseType<Dvat30AProgress | null>> => {
  const functionname = GetDvat30AProgress.name;

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

    const invoiceDateFilter: {
      gte?: Date;
      lte?: Date;
    } = {};

    if (payload.startDate) {
      invoiceDateFilter.gte = new Date(payload.startDate);
    }

    if (payload.endDate) {
      const endDate = new Date(payload.endDate);
      endDate.setHours(23, 59, 59, 999);
      invoiceDateFilter.lte = endDate;
    }

    const whereBase = {
      deletedAt: null,
      deletedBy: null,
      status: "ACTIVE" as const,
      dvat04Id: payload.dvatid,
      ...(Object.keys(invoiceDateFilter).length > 0 && {
        invoice_date: invoiceDateFilter,
      }),
    };

    const [totalInRange, convertedInRange] = await Promise.all([
      prisma.daily_purchase.count({
        where: whereBase,
      }),
      prisma.daily_purchase.count({
        where: {
          ...whereBase,
          is_dvat_30a: true,
        },
      }),
    ]);

    return createResponse({
      functionname,
      message: "DVAT 30/30 A progress fetched.",
      data: {
        totalInRange,
        convertedInRange,
      },
    });
  } catch (e) {
    return createResponse({
      functionname,
      message: errorToString(e),
    });
  }
};

export default GetDvat30AProgress;
