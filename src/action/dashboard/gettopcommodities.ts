"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { SelectOffice } from "@prisma/client";

interface TopCommodityData {
  commodityName: string;
  totalRevenue: number;
  returnCount: number;
}

interface GetTopCommoditiesPayload {
  selectOffice?: SelectOffice;
  commodityType: "FUEL" | "LIQUOR";
  limit?: number;
}

const GetTopCommodities = async (
  payload: GetTopCommoditiesPayload,
): Promise<{
  status: boolean;
  data?: TopCommodityData[];
  message?: string;
}> => {
  const functionname: string = GetTopCommodities.name;

  try {
    const limit = payload.limit || 5;

    // Calculate date range for last 30 days
    const currentDate = new Date();
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - 30,
      0,
      0,
      0,
      0
    );
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      23,
      59,
      59,
      999
    );

    // Build where clause for dvat04
    const dvat04Where: any = {
      status: "APPROVED",
    };

    if (payload.selectOffice) {
      dvat04Where.selectOffice = payload.selectOffice;
    }

    // Get all approved dealers (no commodity filtering on dealers)
    const dealers = await prisma.dvat04.findMany({
      where: dvat04Where,
      select: {
        id: true,
      },
    });

    if (dealers.length === 0) {
      return {
        status: true,
        data: [],
      };
    }

    const dealerIds = dealers.map((d) => d.id);

    // Build where clause for commodity_master based on product_type
    const commodityWhere: any = {
      deletedAt: null,
      deletedById: null,
    };

    if (payload.commodityType === "FUEL") {
      commodityWhere.product_type = "FUEL";
    } else if (payload.commodityType === "LIQUOR") {
      commodityWhere.product_type = "LIQUOR";
    }

    // Get commodities filtered by product_type
    const commodities = await prisma.commodity_master.findMany({
      where: commodityWhere,
      select: {
        id: true,
        product_name: true,
      },
    });

    if (commodities.length === 0) {
      return {
        status: true,
        data: [],
      };
    }

    const commodityIds = commodities.map((c) => c.id);

    const commodityMap = new Map(
      commodities.map((c) => [c.id, c.product_name]),
    );

    // Calculate revenue per commodity from returns_entry
    const commodityRevenue = new Map<
      string,
      { revenue: number; count: number }
    >();

    // Get all returns_01 entries from last 30 days with status PAID
    const returns01Records = await prisma.returns_01.findMany({
      where: {
        dvat04Id: { in: dealerIds },
        status: "PAID",
        file_status: "ACTIVE",
        transaction_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        dvat04Id: true,
      },
    });

    if (returns01Records.length === 0) {
      return {
        status: true,
        data: [],
      };
    }

    const returns01Ids = returns01Records.map((r) => r.id);
    const returns01Map = new Map(
      returns01Records.map((r) => [r.id, r.dvat04Id])
    );

    // Get returns_entry data for these returns_01 records, filtered by commodity_masterId
    const returnsEntries = await prisma.returns_entry.findMany({
      where: {
        returns_01Id: { in: returns01Ids },
        commodity_masterId: { in: commodityIds },
        deletedAt: null,
      },
      select: {
        returns_01Id: true,
        commodity_masterId: true,
        quantity: true,
      },
    });

    // Group entries by commodity
    for (const entry of returnsEntries) {
      const commodityName = entry.commodity_masterId
        ? commodityMap.get(entry.commodity_masterId) || "Other"
        : "Other";
      const quantity = Math.max(0, entry.quantity || 0);

      const current = commodityRevenue.get(commodityName) || {
        revenue: 0,
        count: 0,
      };
      commodityRevenue.set(commodityName, {
        revenue: current.revenue + quantity,
        count: current.count + 1,
      });
    }

    // Convert to array and sort by revenue
    const topCommodities: TopCommodityData[] = Array.from(
      commodityRevenue.entries(),
    )
      .map(([commodityName, data]) => ({
        commodityName,
        totalRevenue: Math.max(0, data.revenue),
        returnCount: data.count,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return {
      status: true,
      data: topCommodities,
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
    };
  }
};

export default GetTopCommodities;
