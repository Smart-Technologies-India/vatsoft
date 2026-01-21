"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface YearlyComparisonPayload {
  selectOffice?: "Dadra_Nagar_Haveli" | "DAMAN" | "DIU";
  selectCommodity?: "FUEL" | "LIQUOR";
  financialYear?: string; // Format: "2024-25" for FY 2024-25
}

interface MonthlyData {
  month: string;
  year: string;
  amount: number;
  count: number;
}

interface YearlyComparisonData {
  currentYear: MonthlyData[];
  previousYear: MonthlyData[];
  currentYearLabel: string;
  previousYearLabel: string;
  currentYearTotal: number;
  previousYearTotal: number;
  percentageChange: number;
}

const YearlyComparison = async (
  payload: YearlyComparisonPayload,
): Promise<{
  status: boolean;
  data?: YearlyComparisonData;
  message?: string;
}> => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11

    // Determine fiscal year (April to March)
    // If current month is Jan-Mar (0-2), we're in FY that started previous year
    // If current month is Apr-Dec (3-11), we're in FY that started this year
    let currentFYStart: number;

    if (payload.financialYear) {
      // Parse the provided financial year (format: "2024-25")
      currentFYStart = parseInt(payload.financialYear.split("-")[0]);
    } else {
      currentFYStart = currentMonth >= 3 ? currentYear : currentYear - 1;
    }

    const previousFYStart = currentFYStart - 1;

    const currentFYLabel = `FY ${currentFYStart}-${(currentFYStart + 1).toString().slice(-2)}`;
    const previousFYLabel = `FY ${previousFYStart}-${(previousFYStart + 1).toString().slice(-2)}`;

    // Build where clause for dvat04 based on office and commodity
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

    // Fetch current fiscal year data (April of currentFYStart to March of currentFYStart+1)
    const currentYearReturns = await prisma.returns_01.findMany({
      where: {
        dvat04: dvatWhereClause,
        status: "PAID",
        file_status: "ACTIVE",
        OR: [
          {
            year: currentFYStart.toString(),
            month: {
              in: ["April", "May", "June", "July", "August", "September", "October", "November", "December"],
            },
          },
          {
            year: (currentFYStart + 1).toString(),
            month: {
              in: ["January", "February", "March"],
            },
          },
        ],
      },
      select: {
        year: true,
        month: true,
        total_tax_amount: true,
      },
    });
    console.log("Current Year Returns Count: ", currentYearReturns.length);
    // Fetch previous fiscal year data
    const previousYearReturns = await prisma.returns_01.findMany({
      where: {
        dvat04: dvatWhereClause,
        status: "PAID",
        file_status: "ACTIVE",
        OR: [
          {
            year: previousFYStart.toString(),
            month: {
              in: ["April", "May", "June", "July", "August", "September", "October", "November", "December"],
            },
          },
          {
            year: (previousFYStart + 1).toString(),
            month: {
              in: ["January", "February", "March"],
            },
          },
        ],
      },
      select: {
        year: true,
        month: true,
        total_tax_amount: true,
      },
    });

    // Process current year data
    const currentYearMonthlyData = new Map<
      string,
      { amount: number; count: number }
    >();
    const months = [
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
      "January",
      "February",
      "March",
    ];

    months.forEach((month) => {
      currentYearMonthlyData.set(month, { amount: 0, count: 0 });
    });

    currentYearReturns.forEach((ret) => {
      const month = ret.month || "";
      const existing = currentYearMonthlyData.get(month) || {
        amount: 0,
        count: 0,
      };
      existing.amount += parseFloat(ret.total_tax_amount || "0");
      existing.count += 1;
      currentYearMonthlyData.set(month, existing);
    });

    // Process previous year data
    const previousYearMonthlyData = new Map<
      string,
      { amount: number; count: number }
    >();

    months.forEach((month) => {
      previousYearMonthlyData.set(month, { amount: 0, count: 0 });
    });

    previousYearReturns.forEach((ret) => {
      const month = ret.month || "";
      const existing = previousYearMonthlyData.get(month) || {
        amount: 0,
        count: 0,
      };
      existing.amount += parseFloat(ret.total_tax_amount || "0");
      existing.count += 1;
      previousYearMonthlyData.set(month, existing);
    });

    // Month name to number mapping for sorting
    const monthNameToNumber: { [key: string]: number } = {
      "April": 4,
      "May": 5,
      "June": 6,
      "July": 7,
      "August": 8,
      "September": 9,
      "October": 10,
      "November": 11,
      "December": 12,
      "January": 1,
      "February": 2,
      "March": 3,
    };

    // Convert to array format
    const currentYearData: MonthlyData[] = months.map((month) => {
      const data = currentYearMonthlyData.get(month) || { amount: 0, count: 0 };
      const monthNum = monthNameToNumber[month];
      const year = monthNum >= 4 ? currentFYStart : currentFYStart + 1;
      return {
        month: month,
        year: year.toString(),
        amount: data.amount,
        count: data.count,
      };
    });

    const previousYearData: MonthlyData[] = months.map((month) => {
      const data = previousYearMonthlyData.get(month) || {
        amount: 0,
        count: 0,
      };
      const monthNum = monthNameToNumber[month];
      const year = monthNum >= 4 ? previousFYStart : previousFYStart + 1;
      return {
        month: month,
        year: year.toString(),
        amount: data.amount,
        count: data.count,
      };
    });

    // Calculate totals
    const currentYearTotal = currentYearData.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const previousYearTotal = previousYearData.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    // Calculate percentage change
    const percentageChange =
      previousYearTotal === 0
        ? 0
        : ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100;

    return {
      status: true,
      data: {
        currentYear: currentYearData,
        previousYear: previousYearData,
        currentYearLabel: currentFYLabel,
        previousYearLabel: previousFYLabel,
        currentYearTotal: currentYearTotal,
        previousYearTotal: previousYearTotal,
        percentageChange: percentageChange,
      },
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
    };
  }
};

export default YearlyComparison;
