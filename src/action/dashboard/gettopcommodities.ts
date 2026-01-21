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

    // Build where clause for dvat04
    const dvat04Where: any = {
      status: "APPROVED",
    };

    if (payload.selectOffice) {
      dvat04Where.selectOffice = payload.selectOffice;
    }

    if (payload.commodityType === "FUEL") {
      dvat04Where.commodity = "FUEL";
    } else if (payload.commodityType === "LIQUOR") {
      dvat04Where.commodity = { in: ["LIQUOR", "MANUFACTURER"] };
    }

    // Get all approved dealers
    const dealers = await prisma.dvat04.findMany({
      where: dvat04Where,
      select: {
        id: true,
        selectComOneId: true,
        selectComTwoId: true,
        selectComThreeId: true,
        selectComFourId: true,
        selectComFiveId: true,
      },
    });

    if (dealers.length === 0) {
      return {
        status: true,
        data: [],
      };
    }

    const dealerIds = dealers.map((d) => d.id);

    // Get all commodity IDs from dealers
    const commodityIds = new Set<number>();
    dealers.forEach((dealer) => {
      if (dealer.selectComOneId) commodityIds.add(dealer.selectComOneId);
      if (dealer.selectComTwoId) commodityIds.add(dealer.selectComTwoId);
      if (dealer.selectComThreeId) commodityIds.add(dealer.selectComThreeId);
      if (dealer.selectComFourId) commodityIds.add(dealer.selectComFourId);
      if (dealer.selectComFiveId) commodityIds.add(dealer.selectComFiveId);
    });

    // Get commodity names
    const commodities = await prisma.commodity_master.findMany({
      where: {
        id: { in: Array.from(commodityIds) },
        deletedAt: null,
        deletedById: null,
      },
      select: {
        id: true,
        product_name: true,
      },
    });

    const commodityMap = new Map(
      commodities.map((c) => [c.id, c.product_name]),
    );

    // Calculate revenue per commodity
    const commodityRevenue = new Map<
      string,
      { revenue: number; count: number }
    >();

    for (const dealer of dealers) {
      const commodityIdsForDealer = [
        dealer.selectComOneId,
        dealer.selectComTwoId,
        dealer.selectComThreeId,
        dealer.selectComFourId,
        dealer.selectComFiveId,
      ].filter((id) => id !== null) as number[];

      // Get returns for this dealer
      const returns = await prisma.returns_01.findMany({
        where: {
          dvat04Id: dealer.id,
          status: "PAID",
          file_status: "ACTIVE",
        },
        select: {
          total_tax_amount: true,
        },
      });

      const dealerRevenue = returns.reduce(
        (sum, ret) => sum + parseFloat(ret.total_tax_amount || "0"),
        0,
      );

      // Distribute revenue equally among commodities
      if (commodityIdsForDealer.length > 0 && dealerRevenue > 0) {
        const revenuePerCommodity =
          dealerRevenue / commodityIdsForDealer.length;

        for (const commodityId of commodityIdsForDealer) {
          const commodityName = commodityMap.get(commodityId) || "Other";
          const current = commodityRevenue.get(commodityName) || {
            revenue: 0,
            count: 0,
          };
          commodityRevenue.set(commodityName, {
            revenue: current.revenue + revenuePerCommodity,
            count: current.count + returns.length,
          });
        }
      }
    }

    // Convert to array and sort by revenue
    const topCommodities: TopCommodityData[] = Array.from(
      commodityRevenue.entries(),
    )
      .map(([commodityName, data]) => ({
        commodityName,
        totalRevenue: data.revenue,
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
