"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface DealerTypeRevenuePayload {
  selectOffice?: "Dadra_Nagar_Haveli" | "DAMAN" | "DIU";
  year?: string;
}

interface MonthlyRevenue {
  month: string;
  fuelRevenue: number;
  liquorRevenue: number;
  fuelDealers: number;
  liquorDealers: number;
}

interface DealerTypeRevenueData {
  monthlyData: MonthlyRevenue[];
  totalFuelRevenue: number;
  totalLiquorRevenue: number;
  totalFuelDealers: number;
  totalLiquorDealers: number;
  fuelPercentage: number;
  liquorPercentage: number;
  year: string;
}

const DealerTypeRevenue = async (
  payload: DealerTypeRevenuePayload,
): Promise<{
  status: boolean;
  data?: DealerTypeRevenueData;
  message?: string;
}> => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const selectedYear = payload.year || currentYear.toString();

    // Build where clause for dvat04
    const dvatWhereClause: any = {};

    if (payload.selectOffice) {
      dvatWhereClause.selectOffice = payload.selectOffice;
    }

    // Fetch all dealers count by type
    const fuelDealersCount = await prisma.dvat04.count({
      where: {
        ...dvatWhereClause,
        commodity: "FUEL",
        status: "APPROVED",
      },
    });

    const liquorDealersCount = await prisma.dvat04.count({
      where: {
        ...dvatWhereClause,
        commodity: "LIQUOR",
        status: "APPROVED",
      },
    });

    // Fetch revenue data for fuel dealers
    const fuelReturns = await prisma.returns_01.findMany({
      where: {
        dvat04: {
          ...dvatWhereClause,
          commodity: "FUEL",
          status: "APPROVED",
        },
        status: "PAID",
        file_status: "ACTIVE",
        year: selectedYear,
      },
      select: {
        month: true,
        vatamount: true,
      },
    });

    // Fetch revenue data for liquor dealers
    const liquorReturns = await prisma.returns_01.findMany({
      where: {
        dvat04: {
          ...dvatWhereClause,
          commodity: "LIQUOR",
          status: "APPROVED",
        },
        status: "PAID",
        file_status: "ACTIVE",
        year: selectedYear,
      },
      select: {
        month: true,
        vatamount: true,
      },
    });

    // Month name to number mapping
    const monthNameToNumber: { [key: string]: string } = {
      January: "01",
      February: "02",
      March: "03",
      April: "04",
      May: "05",
      June: "06",
      July: "07",
      August: "08",
      September: "09",
      October: "10",
      November: "11",
      December: "12",
    };

    // Aggregate data by month
    const monthlyDataMap = new Map<
      string,
      {
        fuelRevenue: number;
        liquorRevenue: number;
      }
    >();

    const months = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ];

    // Initialize all months
    months.forEach((month) => {
      monthlyDataMap.set(month, {
        fuelRevenue: 0,
        liquorRevenue: 0,
      });
    });

    // Process fuel returns
    fuelReturns.forEach((ret) => {
      // Convert month name to number if needed
      let monthNum = ret.month || "00";
      if (monthNameToNumber[monthNum]) {
        monthNum = monthNameToNumber[monthNum];
      }

      const existing = monthlyDataMap.get(monthNum) || {
        fuelRevenue: 0,
        liquorRevenue: 0,
      };
      existing.fuelRevenue += Math.max(0, parseFloat(ret.vatamount || "0"));
      monthlyDataMap.set(monthNum, existing);
    });

    // Process liquor returns
    liquorReturns.forEach((ret) => {
      // Convert month name to number if needed
      let monthNum = ret.month || "00";
      if (monthNameToNumber[monthNum]) {
        monthNum = monthNameToNumber[monthNum];
      }

      const existing = monthlyDataMap.get(monthNum) || {
        fuelRevenue: 0,
        liquorRevenue: 0,
      };
      existing.liquorRevenue += Math.max(0, parseFloat(ret.vatamount || "0"));
      monthlyDataMap.set(monthNum, existing);
    });

    // Convert to array format
    const monthlyData: MonthlyRevenue[] = months.map((month) => {
      const data = monthlyDataMap.get(month) || {
        fuelRevenue: 0,
        liquorRevenue: 0,
      };
      return {
        month: month,
        fuelRevenue: Math.max(0, data.fuelRevenue),
        liquorRevenue: Math.max(0, data.liquorRevenue),
        fuelDealers: Math.max(0, fuelDealersCount),
        liquorDealers: Math.max(0, liquorDealersCount),
      };
    });

    // Calculate totals
    const totalFuelRevenue = Math.max(0, monthlyData.reduce(
      (sum, item) => sum + item.fuelRevenue,
      0,
    ));
    const totalLiquorRevenue = Math.max(0, monthlyData.reduce(
      (sum, item) => sum + item.liquorRevenue,
      0,
    ));
    const totalRevenue = totalFuelRevenue + totalLiquorRevenue;

    // Calculate percentages
    const fuelPercentage = Math.max(0,
      totalRevenue === 0 ? 0 : (totalFuelRevenue / totalRevenue) * 100);
    const liquorPercentage = Math.max(0,
      totalRevenue === 0 ? 0 : (totalLiquorRevenue / totalRevenue) * 100);

    return {
      status: true,
      data: {
        monthlyData,
        totalFuelRevenue,
        totalLiquorRevenue,
        totalFuelDealers: fuelDealersCount,
        totalLiquorDealers: liquorDealersCount,
        fuelPercentage,
        liquorPercentage,
        year: selectedYear,
      },
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
    };
  }
};

export default DealerTypeRevenue;
