"use server";
import { getCurrentUserId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface TopRevenueDealersPayload {
  selectOffice?: "Dadra_Nagar_Haveli" | "DAMAN" | "DIU";
  selectCommodity?: "FUEL" | "LIQUOR";
  year?: string;
  month?: string;
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
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "TopRevenueDealers",
      } as any;
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const selectedYear = payload.year || currentYear.toString();
    const selectedMonth = payload.month;
    const limit = payload.limit || 10;
    
    // Map month number to month name for filtering
    const monthNumberToName: { [key: string]: string } = {
      "01": "January",
      "02": "February",
      "03": "March",
      "04": "April",
      "05": "May",
      "06": "June",
      "07": "July",
      "08": "August",
      "09": "September",
      "10": "October",
      "11": "November",
      "12": "December",
    };

    // Build where clause for dvat04
    const dvatWhereClause: any = {
      status: "APPROVED",
      deletedAt: null,
      deletedById: null,
    };

    if (payload.selectOffice) {
      dvatWhereClause.selectOffice = payload.selectOffice;
    }

    if (payload.selectCommodity) {
      if (payload.selectCommodity === "FUEL") {
        // Show only FUEL
        dvatWhereClause.commodity = "FUEL";
      } else if (payload.selectCommodity === "LIQUOR") {
        // Show all except FUEL (LIQUOR and other commodities)
        dvatWhereClause.commodity = {
          not: "FUEL",
        };
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
      // Get all returns for this dealer for the selected year and month
      const returnsWhereClause: any = {
        dvat04Id: dealer.id,
        status: "PAID",
        file_status: "ACTIVE",
        year: selectedYear,
        deletedAt: null,
        deletedById: null,
      };
      
      // Add month filter if provided
      if (selectedMonth) {
        const monthName = monthNumberToName[selectedMonth];
        if (monthName) {
          returnsWhereClause.month = monthName;
        }
      }
      
      const returns = await prisma.returns_01.findMany({
        where: returnsWhereClause,
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
