"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface DistrictWiseRevenuePayload {
  selectCommodity?: "FUEL" | "LIQUOR";
  startDate?: Date;
  endDate?: Date;
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
    
    // Default date range: current fiscal year
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const fiscalYearStart = currentMonth >= 3 ? currentYear : currentYear - 1;
    
    const defaultStartDate = new Date(fiscalYearStart, 3, 1); // April 1
    const defaultEndDate = new Date(fiscalYearStart + 1, 2, 31); // March 31
    
    const startDate = payload.startDate || defaultStartDate;
    const endDate = payload.endDate || defaultEndDate;

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
        (sum, ret) => sum + parseFloat(ret.total_tax_amount || "0"),
        0
      );

      districtRevenues.push({
        district: district.label,
        revenue: revenue,
        returnCount: returns.length,
        dealerCount: dealerCount,
      });

      totalRevenue += revenue;
      totalReturns += returns.length;
      totalDealers += dealerCount;
    }

    return {
      status: true,
      data: {
        districts: districtRevenues,
        totalRevenue,
        totalReturns,
        totalDealers,
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
