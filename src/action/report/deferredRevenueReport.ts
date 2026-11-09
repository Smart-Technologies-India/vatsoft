"use server";

import prisma from "../../../prisma/database";
import { SelectOffice } from "@prisma/client";

export interface DeferredRevenueData {
  transactionMonth: string;
  forMonths: {
    [forMonth: string]: number;
  };
  total: number;
}

export default async function DeferredRevenueReport(params: {
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

    // Build where clause for challans
    const challanWhere: any = {
      paymentstatus: "PAID",
      deletedAt: null,
      transaction_date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (selectOffice) {
      challanWhere.dvat = {
        selectOffice,
      };
    }


    // Financial year months (April to March) - defines the column order in the table
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

    // Create a map for months to numbers (used for sorting transaction months)
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

    // Process challan and returns data to create deferred revenue matrix
    // Rows: Transaction month (when payment came in)
    // Columns: For month (which month the payment was for)
    // This shows if revenue is on-time, deferred, or early

    // For returns_01: We know both the "for month" and transaction_date
    // For challans: We link through returns_01 to get the "for month"

    // Helper function to convert calendar month to financial year month name
    const getFinancialMonthName = (calendarMonthIndex: number): string => {
      // JavaScript getMonth() returns 0-11 (Jan=0, Dec=11)
      // Financial year starts at April (index 3)
      if (calendarMonthIndex >= 3) {
        // April-December: use index directly into monthNames
        return monthNames[calendarMonthIndex - 3];
      } else {
        // January-March: offset by 9 (January=9, Feb=10, Mar=11)
        return monthNames[calendarMonthIndex + 9];
      }
    };

    // Get challans with their related returns to understand the "for month"
    const challansWithReturns = await prisma.challan.findMany({
      where: challanWhere,
      include: {
        returns_01: {
          select: {
            month: true,
            year: true,
          },
        },
      },
    });

    // Create a matrix for transaction month vs for month
    const matrix: {
      [transactionMonth: string]: { [forMonth: string]: number };
    } = {};

    // Process challans linked to returns - only challans
    challansWithReturns.forEach((challan) => {
      if (!challan.transaction_date) return;

      const transactionDate = new Date(challan.transaction_date);
      const transactionMonth = getFinancialMonthName(transactionDate.getMonth());

      // Determine the "for month" from the linked return
      let forMonth = transactionMonth; // Default to transaction month if no return linked
      if (challan.returns_01 && challan.returns_01.month) {
        forMonth = challan.returns_01.month;
      }

      if (!matrix[transactionMonth]) {
        matrix[transactionMonth] = {};
      }

      const amount = parseFloat(challan.total_tax_amount || "0");
      if (amount > 0) {
        matrix[transactionMonth][forMonth] =
          (matrix[transactionMonth][forMonth] || 0) + amount;
      }
    });

    // Create result data
    const result: DeferredRevenueData[] = [];

    Object.keys(matrix).forEach((transactionMonth) => {
      const row: DeferredRevenueData = {
        transactionMonth,
        forMonths: matrix[transactionMonth],
        total: Object.values(matrix[transactionMonth]).reduce(
          (sum, val) => sum + val,
          0,
        ),
      };
      result.push(row);
    });

    // Sort by transaction month
    result.sort(
      (a, b) =>
        (monthMap[a.transactionMonth] || 0) -
        (monthMap[b.transactionMonth] || 0),
    );

    return {
      status: true,
      message: "Deferred Revenue Report fetched successfully",
      data: result,
      monthNames,
    };
  } catch (error) {
    console.error("Error fetching deferred revenue report:", error);
    return {
      status: false,
      message: "Failed to fetch deferred revenue report",
      data: null,
    };
  }
}
