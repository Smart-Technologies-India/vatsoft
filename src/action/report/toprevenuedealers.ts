"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface TopRevenueDealersPayload {
  selectOffice?: "Dadra_Nagar_Haveli" | "DAMAN" | "DIU";
  selectCommodity?: "FUEL" | "LIQUOR";
  year?: string;
  limit?: number;
}

interface DealerRevenueData {
  id: number;
  tinNumber: string;
  name: string;
  tradename: string;
  commodity: string;
  selectOffice: string;
  contact_one: string;
  totalRevenue: number;
  returnsFiled: number;
  averageRevenuePerReturn: number;
  rank: number;
}

const TopRevenueDealers = async (
  payload: TopRevenueDealersPayload
): Promise<{
  status: boolean;
  data?: DealerRevenueData[];
  message?: string;
}> => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const selectedYear = payload.year || currentYear.toString();
    const limit = payload.limit || 10;

    // Build where clause for dvat04
    const dvatWhereClause: any = {
      status: "APPROVED",
    };

    if (payload.selectOffice) {
      dvatWhereClause.selectOffice = payload.selectOffice;
    }

    if (payload.selectCommodity) {
      if (payload.selectCommodity === "FUEL") {
        dvatWhereClause.commodity = "FUEL";
      } else if (payload.selectCommodity === "LIQUOR") {
        dvatWhereClause.commodity = "LIQUOR";
      }
    }

    // Get all dealers matching the criteria
    const dealers = await prisma.dvat04.findMany({
      where: dvatWhereClause,
      select: {
        id: true,
        tinNumber: true,
        name: true,
        tradename: true,
        commodity: true,
        selectOffice: true,
        contact_one: true,
      },
    });

    // Calculate revenue for each dealer
    const dealerRevenueList: DealerRevenueData[] = [];

    for (const dealer of dealers) {
      // Get all returns for this dealer for the selected year
      const returns = await prisma.returns_01.findMany({
        where: {
          dvat04Id: dealer.id,
          status: "PAID",
          file_status: "ACTIVE",
          year: selectedYear,
        },
        select: {
          vatamount: true,
        },
      });

      if (returns.length === 0) continue;

      // Calculate total revenue
      const totalRevenue = returns.reduce(
        (sum, ret) => sum + Math.max(0, parseFloat(ret.vatamount || "0")),
        0
      );

      const averageRevenuePerReturn = totalRevenue / returns.length;

      dealerRevenueList.push({
        id: dealer.id,
        tinNumber: dealer.tinNumber || "N/A",
        name: dealer.name || "N/A",
        tradename: dealer.tradename || "N/A",
        commodity: dealer.commodity || "OTHER",
        selectOffice: dealer.selectOffice || "N/A",
        contact_one: dealer.contact_one || "N/A",
        totalRevenue: Math.max(0, totalRevenue),
        returnsFiled: Math.max(0, returns.length),
        averageRevenuePerReturn: Math.max(0, averageRevenuePerReturn),
        rank: 0,
      });
    }

    // Sort by total revenue (descending) and take top N
    dealerRevenueList.sort((a, b) => b.totalRevenue - a.totalRevenue);
    const topDealers = dealerRevenueList.slice(0, limit);

    // Assign ranks
    topDealers.forEach((dealer, index) => {
      dealer.rank = index + 1;
    });

    return {
      status: true,
      data: topDealers,
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
    };
  }
};

export default TopRevenueDealers;
