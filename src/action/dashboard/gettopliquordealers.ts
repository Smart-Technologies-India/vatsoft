"use server";

import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";

interface TopDealerData {
  id: number;
  name: string;
  tinNumber: string;
  totalRevenue: number;
  tradename: string;
}

export default async function GetTopLiquorDealers(data: {
  selectOffice?: "Dadra_Nagar_Haveli" | "DAMAN" | "DIU";
}): Promise<ApiResponseType<TopDealerData[]>> {
  try {
    const { selectOffice } = data;

    // Build where clause based on office selection
    const whereClause: any = {};

    if (selectOffice) {
      whereClause.selectOffice = selectOffice;
    }

    // Get all liquor dealers
    const liquorDealers = await prisma.dvat04.findMany({
      where: {
        deletedAt: null,
        commodity: "LIQUOR",
        ...whereClause,
      },
      select: {
        id: true,
        name: true,
        tinNumber: true,
        tradename: true,
      },
    });

    // Calculate revenue for each dealer from daily_sale and daily_purchase
    const dealersWithRevenue = await Promise.all(
      liquorDealers.map(async (dealer) => {
        // Get all sales for this dealer
        const sales = await prisma.daily_sale.findMany({
          where: {
            dvat04Id: dealer.id,
            deletedAt: null,
            status: "ACTIVE",
          },
          select: {
            vatamount: true,
          },
        });

        // Get all purchases for this dealer
        const purchases = await prisma.daily_purchase.findMany({
          where: {
            dvat04Id: dealer.id,
            deletedAt: null,
            status: "ACTIVE",
          },
          select: {
            vatamount: true,
          },
        });

        // Manually sum up the VAT amounts
        const salesTax = sales.reduce(
          (sum, sale) => sum + parseFloat(sale.vatamount || "0"),
          0,
        );
        const purchaseTax = purchases.reduce(
          (sum, purchase) => sum + parseFloat(purchase.vatamount || "0"),
          0,
        );

        // Total revenue is sales tax + purchase tax
        const totalRevenue = salesTax + purchaseTax;

        return {
          id: dealer.id,
          name: dealer.name || "Unknown Dealer",
          tinNumber: dealer.tinNumber || "N/A",
          totalRevenue: totalRevenue,
          tradename: dealer.tradename || "N/A",
        };
      }),
    );

    // Sort by revenue and get top 10
    const topDealers = dealersWithRevenue
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    return {
      status: true,
      data: topDealers,
      message: "Top liquor dealers fetched successfully",
      functionname: "GetTopLiquorDealers",
    };
  } catch (error: any) {
    return {
      status: false,
      data: [],
      message: error.message || "Failed to fetch top liquor dealers",
      functionname: "GetTopLiquorDealers",
    };
  }
}
