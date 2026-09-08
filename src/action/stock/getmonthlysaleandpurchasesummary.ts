"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { createResponse, ApiResponseType } from "@/models/response";

interface MonthlySummary {
  month: number;
  year: number;
  monthName: string;
  salesCount: number;
  purchaseCount: number;
  salesTotalAmount: number;
  salesTotalVat: number;
  purchaseTotalAmount: number;
  purchaseTotalVat: number;
}

interface GetMonthlySaleAndPurchaseSummaryPayload {
  dvatid: number;
}

const GetMonthlySaleAndPurchaseSummary = async (
  payload: GetMonthlySaleAndPurchaseSummaryPayload,
): Promise<ApiResponseType<MonthlySummary[]>> => {
  const functionname: string = GetMonthlySaleAndPurchaseSummary.name;

  try {
    // Get all sales and purchases for this DVAT
    const [dailySales, dailyPurchases] = await Promise.all([
      prisma.daily_sale.findMany({
        where: {
          dvat04Id: payload.dvatid,
          status: "ACTIVE",
        },
        select: {
          invoice_date: true,
          amount: true,
          vatamount: true,
        },
      }),
      prisma.daily_purchase.findMany({
        where: {
          dvat04Id: payload.dvatid,
          status: "ACTIVE",
        },
        select: {
          invoice_date: true,
          amount: true,
          vatamount: true,
        },
      }),
    ]);

    // Group by month
    const monthlyData = new Map<string, MonthlySummary>();

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

    // Process sales data
    dailySales.forEach((sale) => {
      const date = new Date(sale.invoice_date);
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;

      if (!monthlyData.has(key)) {
        monthlyData.set(key, {
          month,
          year,
          monthName: monthNames[month],
          salesCount: 0,
          purchaseCount: 0,
          salesTotalAmount: 0,
          salesTotalVat: 0,
          purchaseTotalAmount: 0,
          purchaseTotalVat: 0,
        });
      }

      const data = monthlyData.get(key)!;
      data.salesCount += 1;
      data.salesTotalAmount += Number(sale.amount) || 0;
      data.salesTotalVat += Number(sale.vatamount) || 0;
    });

    // Process purchase data
    dailyPurchases.forEach((purchase) => {
      const date = new Date(purchase.invoice_date);
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;

      if (!monthlyData.has(key)) {
        monthlyData.set(key, {
          month,
          year,
          monthName: monthNames[month],
          salesCount: 0,
          purchaseCount: 0,
          salesTotalAmount: 0,
          salesTotalVat: 0,
          purchaseTotalAmount: 0,
          purchaseTotalVat: 0,
        });
      }

      const data = monthlyData.get(key)!;
      data.purchaseCount += 1;
      data.purchaseTotalAmount += Number(purchase.amount) || 0;
      data.purchaseTotalVat += Number(purchase.vatamount) || 0;
    });

    // Convert to array and sort by year and month
    const result = Array.from(monthlyData.values()).sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });

    return createResponse({
      message: "Monthly sales and purchase summary retrieved successfully",
      data: result,
      functionname: functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetMonthlySaleAndPurchaseSummary;
