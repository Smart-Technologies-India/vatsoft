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

export default async function GetTopFuelDealers(data: {
  selectOffice?: "Dadra_Nagar_Haveli" | "DAMAN" | "DIU";
}): Promise<ApiResponseType<TopDealerData[]>> {
  try {
    const { selectOffice } = data;

    // Build where clause based on office selection
    const whereClause: any = {};

    if (selectOffice) {
      whereClause.selectOffice = selectOffice;
    }

    // Get all fuel/petroleum dealers
    const fuelDealers = await prisma.dvat04.findMany({
      where: {
        deletedAt: null,
        ...whereClause,
        commodity: "FUEL",
      },
      select: {
        id: true,
        name: true,
        tinNumber: true,
        tradename: true,
      },
    });

    // Calculate date range for last 30 days
    const currentDate = new Date();
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - 30,
      0,
      0,
      0,
      0
    );
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      23,
      59,
      59,
      999
    );

    // Calculate revenue for each dealer from returns_01 table (last 30 days)
    const dealersWithRevenue = await Promise.all(
      fuelDealers.map(async (dealer) => {
        // Get all returns for this dealer from last 30 days
        const returns = await prisma.returns_01.findMany({
          where: {
            dvat04Id: dealer.id,
            deletedAt: null,
            file_status: "ACTIVE",
            transaction_date: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            vatamount: true,
          },
        });

        // Sum up the VAT amounts, ensuring no negative values
        const totalRevenue = returns.reduce(
          (sum, ret) => sum + Math.max(0, parseFloat(ret.vatamount || "0")),
          0,
        );

        return {
          id: dealer.id,
          name: dealer.name || "Unknown Dealer",
          tinNumber: dealer.tinNumber || "N/A",
          totalRevenue: Math.max(0, totalRevenue),
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
      message: "Top fuel dealers fetched successfully",
      functionname: "GetTopFuelDealers",
    };
  } catch (error: any) {
    return {
      status: false,
      data: [],
      message: error.message || "Failed to fetch top fuel dealers",
      functionname: "GetTopFuelDealers",
    };
  }
}
