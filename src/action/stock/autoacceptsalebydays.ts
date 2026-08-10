"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface AutoAcceptSaleByDaysPayload {
  startDate: Date;
  endDate: Date;
}

const AutoAcceptSaleByDays = async (
  payload: AutoAcceptSaleByDaysPayload,
): Promise<ApiResponseType<{ acceptedCount: number; pendingCount: number }>> => {
  const functionname: string = AutoAcceptSaleByDays.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return createResponse({
        message: "Not authenticated. Please login.",
        functionname,
      });
    }

    // Get all pending sales for the date range
    const pendingSales = await prisma.daily_sale.findMany({
      where: {
        dvat04Id: currentDvatId,
        is_accept: false,
        deletedAt: null,
        invoice_date: {
          gte: payload.startDate,
          lte: payload.endDate,
        },
      },
      include: {
        seller_tin_number: true,
        commodity_master: true,
      },
      orderBy: {
        invoice_date: "asc",
      },
    });

    if (pendingSales.length === 0) {
      return createResponse({
        message: "No pending sales found.",
        functionname,
        data: { acceptedCount: 0, pendingCount: 0 },
      });
    }

    // Group by invoice_number, invoice_date, and seller_tin_number (trade name)
    const groupedSales = new Map<
      string,
      Array<(typeof pendingSales)[0]>
    >();

    pendingSales.forEach((sale) => {
      const groupKey = `${sale.invoice_number}|${sale.invoice_date.toISOString().split("T")[0]}|${sale.seller_tin_numberId}`;
      if (!groupedSales.has(groupKey)) {
        groupedSales.set(groupKey, []);
      }
      groupedSales.get(groupKey)!.push(sale);
    });

    // Check each group for 12+ day rule
    const now = new Date();
    const twelveHoursInMs = 12 * 24 * 60 * 60 * 1000; // 12 days in milliseconds
    let acceptedCount = 0;

    for (const [groupKey, groupSales] of groupedSales) {
      // Check if ALL sales in this group have createdAt older than 12 days
      const allOlderThan12Days = groupSales.every((sale) => {
        const ageInMs = now.getTime() - new Date(sale.createdAt).getTime();
        return ageInMs > twelveHoursInMs;
      });

      // If all sales are older than 12 days, accept the entire group
      if (allOlderThan12Days) {
        const groupSaleIds = groupSales.map((s) => s.id);

        await prisma.daily_sale.updateMany({
          where: {
            id: {
              in: groupSaleIds,
            },
          },
          data: {
            is_accept: true,
            updatedById: currentUserId,
            updatedAt: new Date(),
          },
        });

        acceptedCount += groupSales.length;
      }
    }

    // Check if there are still pending sales after auto-accept
    const remainingPendingSales = await prisma.daily_sale.count({
      where: {
        dvat04Id: currentDvatId,
        is_accept: false,
        deletedAt: null,
        invoice_date: {
          gte: payload.startDate,
          lte: payload.endDate,
        },
      },
    });

    return createResponse({
      message:
        acceptedCount > 0
          ? `Auto-accepted ${acceptedCount} pending sales that are older than 12 days.`
          : "No sales eligible for auto-acceptance.",
      functionname,
      data: { acceptedCount, pendingCount: remainingPendingSales },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default AutoAcceptSaleByDays;
