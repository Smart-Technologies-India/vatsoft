"use server";

import prisma from "../../../prisma/database";
import { SelectOffice } from "@prisma/client";

export interface DeferredRevenueDataLiquor {
  transactionMonth: string;
  forMonths: { [key: string]: number };
  total: number;
}

export default async function DeferredRevenueReportLiquor(params: {
  selectOffice?: SelectOffice;
  financialYear?: string;
}) {
  try {
    const { selectOffice, financialYear } = params;

    // Parse financial year (e.g., "2026-2027" -> start: Apr 2026, end: Mar 2027)
    let startDate: Date;
    let endDate: Date;

    if (financialYear) {
      const [startYear, endYear] = financialYear.split("-").map(Number);
      startDate = new Date(startYear, 3, 1); // April 1st of start year
      endDate = new Date(endYear, 2, 31); // March 31st of end year
    } else {
      // Default to current financial year
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      if (currentMonth >= 3) {
        // April or later - current year is start year
        startDate = new Date(currentYear, 3, 1);
        endDate = new Date(currentYear + 1, 2, 31);
      } else {
        // January to March - previous year is start year
        startDate = new Date(currentYear - 1, 3, 1);
        endDate = new Date(currentYear, 2, 31);
      }
    }

    // Month mapping for financial year (April to March)
    const monthMap: { [key: string]: number } = {
      April: 0,
      May: 1,
      June: 2,
      July: 3,
      August: 4,
      September: 5,
      October: 6,
      November: 7,
      December: 8,
      January: 9,
      February: 10,
      March: 11,
    };

    const monthNames = [
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

    // Build where clause for LIQUOR challans
    const challanWhere: any = {
      paymentstatus: "PAID",
      deletedAt: null,
      transaction_date: {
        gte: startDate,
        lte: endDate,
      },
      dvat: {
        commodity: "FUEL",
      },
    };

    if (selectOffice) {
      challanWhere.dvat.selectOffice = selectOffice;
    }

    // Fetch all paid challans for liquor
    const challans = await prisma.challan.findMany({
      where: challanWhere,
      include: {
        returns_01: {
          select: {
            month: true,
          },
        },
      },
    });

    // Build pivot matrix
    const pivotData: { [key: string]: DeferredRevenueDataLiquor } = {};

    // Process challans - only challans
    challans.forEach((challan) => {
      if (!challan.transaction_date) return;

      const challanDate = new Date(challan.transaction_date);
      const transactionMonthNum = challanDate.getMonth();
      const transactionYear = challanDate.getFullYear();

      // Map calendar month to financial year month
      let transactionMonth: string;
      if (transactionMonthNum >= 3) {
        // April-December
        transactionMonth = monthNames[transactionMonthNum - 3];
      } else {
        // January-March (belongs to previous financial year)
        transactionMonth = monthNames[transactionMonthNum + 9];
      }

      // Determine for month
      let forMonth = transactionMonth;
      if (challan.returns_01 && challan.returns_01.month) {
        forMonth = challan.returns_01.month;
      }

      if (!pivotData[transactionMonth]) {
        pivotData[transactionMonth] = {
          transactionMonth,
          forMonths: {},
          total: 0,
        };
        monthNames.forEach((m) => {
          pivotData[transactionMonth].forMonths[m] = 0;
        });
      }

      const amount = parseFloat(challan.total_tax_amount || "0");
      pivotData[transactionMonth].forMonths[forMonth] =
        (pivotData[transactionMonth].forMonths[forMonth] || 0) + amount;
    });

    // Calculate totals
    Object.values(pivotData).forEach((row) => {
      row.total = Object.values(row.forMonths).reduce(
        (sum, val) => sum + (val || 0),
        0
      );
    });

    const result = monthNames
      .map((month) => pivotData[month] || null)
      .filter((r) => r !== null) as DeferredRevenueDataLiquor[];

    return {
      status: true,
      data: result,
      monthNames,
      message: "Liquor report fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching liquor deferred revenue report:", error);
    return {
      status: false,
      data: [],
      monthNames: [],
      message: "Failed to fetch liquor report",
    };
  }
}
