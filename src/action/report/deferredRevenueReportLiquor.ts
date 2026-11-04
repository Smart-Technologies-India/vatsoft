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
  year?: string;
}) {
  try {
    const { selectOffice, year = new Date().getFullYear().toString() } = params;
    const yearNum = parseInt(year);

    // Month mapping
    const monthMap: { [key: string]: number } = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };

    const monthNames = Object.keys(monthMap);

    // Build where clause for LIQUOR challans
    const challanWhere: any = {
      paymentstatus: "PAID",
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
      const challanYear = challanDate.getFullYear();
      if (challanYear !== yearNum) return;

      const transactionMonthNum = challanDate.getMonth();
      const transactionMonth = monthNames[transactionMonthNum];

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
