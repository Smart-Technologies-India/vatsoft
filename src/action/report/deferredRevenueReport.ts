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
  year?: string;
}) {
  try {
    const { selectOffice, year } = params;

    // Build where clause for challans
    const challanWhere: any = {
      paymentstatus: "PAID",
      deletedAt: null,
      transaction_date: {
        not: null,
      },
    };

    if (selectOffice) {
      challanWhere.dvat = {
        selectOffice,
      };
    }


    // Create a map for months to numbers
    const monthMap: { [key: string]: number } = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Process challan and returns data to create deferred revenue matrix
    // Rows: Transaction month (when payment came in)
    // Columns: For month (which month the payment was for)
    // This shows if revenue is on-time, deferred, or early

    // For returns_01: We know both the "for month" and transaction_date
    // For challans: We link through returns_01 to get the "for month"

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
      const transactionMonth = monthNames[transactionDate.getMonth()];

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
