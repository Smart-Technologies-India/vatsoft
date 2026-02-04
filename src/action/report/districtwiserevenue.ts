"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface DistrictWiseRevenuePayload {
  selectCommodity?: "FUEL" | "LIQUOR";
  filterType?: "MONTH" | "YEAR";
  month?: number;
  year?: number;
}

interface DistrictRevenue {
  district: string;
  revenue: number;
  returnCount: number;
  dealerCount: number;
}

interface DistrictWiseRevenueData {
  districts: DistrictRevenue[];
  totalRevenue: number;
  totalReturns: number;
  totalDealers: number;
}

const DistrictWiseRevenue = async (
  payload: DistrictWiseRevenuePayload = {}
): Promise<{
  status: boolean;
  data?: DistrictWiseRevenueData;
  message?: string;
}> => {
  try {
    const currentDate = new Date();
    
    // Build date filter based on filterType
    let startDate: Date;
    let endDate: Date;

    if (payload.year) {
      if (payload.filterType === "MONTH" && payload.month) {
        // Filter by specific month and year
        startDate = new Date(payload.year, payload.month - 1, 1, 0, 0, 0, 0);
        endDate = new Date(payload.year, payload.month, 0, 23, 59, 59, 999);
      } else {
        // Filter by year only
        startDate = new Date(payload.year, 0, 1, 0, 0, 0, 0);
        endDate = new Date(payload.year, 11, 31, 23, 59, 59, 999);
      }
    } else {
      // Default: current year
      const year = currentDate.getFullYear();
      startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    const districts = [
      { value: "Dadra_Nagar_Haveli", label: "Dadra & Nagar Haveli" },
      { value: "DAMAN", label: "Daman" },
      { value: "DIU", label: "Diu" },
    ];

    const districtRevenues: DistrictRevenue[] = [];
    let totalRevenue = 0;
    let totalReturns = 0;
    let totalDealers = 0;

    for (const district of districts) {
      // Build dvat04 where clause
      const dvat04Where: any = {
        selectOffice: district.value,
        status: "APPROVED",
      };

      if (payload.selectCommodity === "FUEL") {
        dvat04Where.commodity = "FUEL";
      } else if (payload.selectCommodity === "LIQUOR") {
        dvat04Where.commodity = { not: "FUEL" };
      }

      // Get dealer count
      const dealerCount = await prisma.dvat04.count({
        where: dvat04Where,
      });

      // Get revenue and return count
      const returns = await prisma.returns_01.findMany({
        where: {
          dvat04: dvat04Where,
          status: "PAID",
          file_status: "ACTIVE",
          transaction_date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          total_tax_amount: true,
        },
      });

      const revenue = returns.reduce(
        (sum, ret) => sum + Math.max(0, parseFloat(ret.total_tax_amount || "0")),
        0
      );

      districtRevenues.push({
        district: district.label,
        revenue: Math.max(0, revenue),
        returnCount: Math.max(0, returns.length),
        dealerCount: Math.max(0, dealerCount),
      });

      totalRevenue += Math.max(0, revenue);
      totalReturns += Math.max(0, returns.length);
      totalDealers += Math.max(0, dealerCount);
    }

    return {
      status: true,
      data: {
        districts: districtRevenues,
        totalRevenue: Math.max(0, totalRevenue),
        totalReturns: Math.max(0, totalReturns),
        totalDealers: Math.max(0, totalDealers),
      },
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
    };
  }
};

export default DistrictWiseRevenue;
