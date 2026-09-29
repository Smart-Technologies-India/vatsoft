"use server";
import { getCurrentUserId } from "@/lib/auth";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import { returns_entry } from "@prisma/client";

function getDateMonthsAgo(date: Date, monthsAgo: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Calculate new month and year
  const newMonth = month - monthsAgo;
  const newDate = new Date(year, newMonth, 1); // handles negative months correctly
  return newDate;
}

const PetroleumCommodityReport = async (
  year: string,
  month?: string,
  selectOffice?: SelectOffice,
  skip: number = 0,
  take: number = 10,
): Promise<
  ApiResponseType<{
    data: Array<{
      id: number;
      name: string;
      total_quantity: number;
      total_amount: number;
      count: number;
      office: string;
      vatamount: number;
    }>;
    total: number;
    debugInfo?: {
      year: string;
      month: string | undefined;
      selectOffice: string | undefined;
      skip: number;
      take: number;
      rawMonthParam: string | undefined;
    };
  } | null>
> => {
  const functionname: string = PetroleumCommodityReport.name;
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "PetroleumCommodityReport",
      } as any;
    }

    const targetYear = parseInt(year) || new Date().getFullYear();
    
    // If month is provided and not empty, query that specific month
    // If not, query the entire year
    let dateFilter: any;
    
    // Normalize month - treat empty string as no month
    const normalizedMonth = month && typeof month === "string" && month.trim() ? month.trim() : undefined;
    
    if (normalizedMonth && normalizedMonth.length > 0) {
      const targetMonth = parseInt(normalizedMonth, 10);
      // Validate month is between 1 and 12
      if (!isNaN(targetMonth) && targetMonth >= 1 && targetMonth <= 12) {
        const firstDateOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const lastDateOfMonth = new Date(targetYear, targetMonth, 1);
        dateFilter = {
          gte: firstDateOfMonth,
          lt: lastDateOfMonth,
        };
      } else {
        // Invalid month, query full year
        const firstDateOfYear = new Date(targetYear, 0, 1);
        const lastDateOfYear = new Date(targetYear + 1, 0, 1);
        dateFilter = {
          gte: firstDateOfYear,
          lt: lastDateOfYear,
        };
      }
    } else {
      // Query entire year when no month
      const firstDateOfYear = new Date(targetYear, 0, 1);
      const lastDateOfYear = new Date(targetYear + 1, 0, 1);
      dateFilter = {
        gte: firstDateOfYear,
        lt: lastDateOfYear,
      };
    }

    // Fetch commodity data first to filter at database level
    const commodityData = await prisma.commodity_master.findMany({
      where: {
        product_type: "FUEL",
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
    });

    if (commodityData.length === 0) {
      return createResponse({
        functionname: functionname,
        message: "No active petroleum commodities found.",
        data: null,
      });
    }

    const commodityIds = commodityData.map((c) => c.id);

    // Fetch all matching records with minimal fields to reduce memory footprint
    // Using select instead of include to avoid loading unnecessary data
    const response = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        invoice_date: dateFilter,
        commodity_masterId: { in: commodityIds },
        ...(selectOffice && {
          returns_01: {
            dvat04: {
              selectOffice: selectOffice,
            },
          },
        }),
      },
      select: {
        quantity: true,
        total_invoice_number: true,
        vatamount: true,
        commodity_masterId: true,
        createdBy: {
          select: {
            selectOffice: true,
          },
        },
      },
    });

    if (response.length === 0) {
      return createResponse({
        functionname: functionname,
        message: "No data found for the specified period.",
        data: null,
      });
    }

    // Create commodity lookup map for O(1) access
    const commodityMap = new Map(commodityData.map((c) => [c.id, c]));

    // Aggregate the fetched data
    const aggregationMap: Record<
      string,
      {
        id: number;
        name: string;
        office: string;
        total_quantity: number;
        total_amount: number;
        count: number;
        vatamount: number;
      }
    > = {};

    for (const entry of response) {
      const commodityId = entry.commodity_masterId;
      const userOffice = entry.createdBy?.selectOffice;
      if (!commodityId || !userOffice) continue;

      const commodity = commodityMap.get(commodityId);
      if (!commodity) continue;

      const key = `${commodityId}_${userOffice}`;

      if (!aggregationMap[key]) {
        aggregationMap[key] = {
          id: commodityId,
          name: commodity.product_name,
          office: userOffice,
          total_quantity: 0,
          total_amount: 0,
          count: 0,
          vatamount: 0,
        };
      }

      aggregationMap[key].total_quantity += entry.quantity || 0;
      aggregationMap[key].total_amount +=
        parseInt(entry.total_invoice_number?.toString() ?? "0") || 0;
      aggregationMap[key].count += 1;
      aggregationMap[key].vatamount += Math.max(
        0,
        parseInt(entry.vatamount?.toString() ?? "0"),
      );
    }

    // Sort by total amount for consistent ordering
    const allAggregatedData = Object.values(aggregationMap).sort(
      (a, b) => b.total_amount - a.total_amount,
    );

    // Apply pagination to aggregated results
    const totalCount = allAggregatedData.length;
    const paginatedData = allAggregatedData.slice(skip, skip + take);

    return createResponse({
      functionname,
      message: "Officer Dashboard data.",
      data: {
        data: paginatedData,
        total: totalCount,
        debugInfo: {
          year,
          month: normalizedMonth,
          selectOffice,
          skip,
          take,
          rawMonthParam: month,
        },
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default PetroleumCommodityReport;
