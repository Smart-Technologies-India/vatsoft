"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface CommoditySalesGrowthPayload {
  selectOffice?: "Dadra_Nagar_Haveli" | "DAMAN" | "DIU";
  selectCommodity?: "FUEL" | "LIQUOR";
  growthType: "MONTH_ON_MONTH" | "YEAR_ON_YEAR";
}

interface CommodityGrowthData {
  commodityId: number;
  commodityName: string;
  currentPeriod: string;
  previousPeriod: string;
  currentAmount: number;
  previousAmount: number;
  currentQuantity: number;
  previousQuantity: number;
  amountGrowth: number;
  quantityGrowth: number;
  amountGrowthPercent: number;
  quantityGrowthPercent: number;
}

const CommoditySalesGrowth = async (
  payload: CommoditySalesGrowthPayload
): Promise<{
  status: boolean;
  data?: CommodityGrowthData[];
  message?: string;
}> => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11

    let currentPeriodLabel = "";
    let previousPeriodLabel = "";
    let currentPeriodCondition: any = {};
    let previousPeriodCondition: any = {};

    if (payload.growthType === "MONTH_ON_MONTH") {
      // Current month vs previous month
      const currentMonthStr = String(currentMonth + 1).padStart(2, "0");
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousMonthStr = String(previousMonth + 1).padStart(2, "0");
      const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      currentPeriodLabel = `${currentYear}-${currentMonthStr}`;
      previousPeriodLabel = `${previousMonthYear}-${previousMonthStr}`;

      currentPeriodCondition = {
        year: currentYear.toString(),
        month: currentMonthStr,
      };

      previousPeriodCondition = {
        year: previousMonthYear.toString(),
        month: previousMonthStr,
      };
    } else {
      // Year on Year - same month, previous year
      const currentMonthStr = String(currentMonth + 1).padStart(2, "0");
      const previousYear = currentYear - 1;

      currentPeriodLabel = `${currentYear}-${currentMonthStr}`;
      previousPeriodLabel = `${previousYear}-${currentMonthStr}`;

      currentPeriodCondition = {
        year: currentYear.toString(),
        month: currentMonthStr,
      };

      previousPeriodCondition = {
        year: previousYear.toString(),
        month: currentMonthStr,
      };
    }

    // Build where clause for dvat04
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

    // Fetch current period data
    const currentPeriodData = await prisma.returns_entry.findMany({
      where: {
        returns_01: {
          ...currentPeriodCondition,
          status: "PAID",
          file_status: "ACTIVE",
          dvat04: dvatWhereClause,
        },
        status: "ACTIVE",
        commodity_masterId: {
          not: null,
        },
      },
      select: {
        commodity_masterId: true,
        amount: true,
        quantity: true,
        commodity_master: {
          select: {
            id: true,
            product_name: true,
          },
        },
      },
    });

    // Fetch previous period data
    const previousPeriodData = await prisma.returns_entry.findMany({
      where: {
        returns_01: {
          ...previousPeriodCondition,
          status: "PAID",
          file_status: "ACTIVE",
          dvat04: dvatWhereClause,
        },
        status: "ACTIVE",
        commodity_masterId: {
          not: null,
        },
      },
      select: {
        commodity_masterId: true,
        amount: true,
        quantity: true,
        commodity_master: {
          select: {
            id: true,
            product_name: true,
          },
        },
      },
    });

    // Aggregate data by commodity
    const commodityMap = new Map<
      number,
      {
        name: string;
        currentAmount: number;
        previousAmount: number;
        currentQuantity: number;
        previousQuantity: number;
      }
    >();

    // Process current period
    currentPeriodData.forEach((entry) => {
      if (entry.commodity_masterId && entry.commodity_master) {
        const id = entry.commodity_masterId;
        const existing = commodityMap.get(id) || {
          name: entry.commodity_master.product_name,
          currentAmount: 0,
          previousAmount: 0,
          currentQuantity: 0,
          previousQuantity: 0,
        };
        existing.currentAmount += parseFloat(entry.amount || "0");
        existing.currentQuantity += entry.quantity || 0;
        commodityMap.set(id, existing);
      }
    });

    // Process previous period
    previousPeriodData.forEach((entry) => {
      if (entry.commodity_masterId && entry.commodity_master) {
        const id = entry.commodity_masterId;
        const existing = commodityMap.get(id) || {
          name: entry.commodity_master.product_name,
          currentAmount: 0,
          previousAmount: 0,
          currentQuantity: 0,
          previousQuantity: 0,
        };
        existing.previousAmount += parseFloat(entry.amount || "0");
        existing.previousQuantity += entry.quantity || 0;
        commodityMap.set(id, existing);
      }
    });

    // Convert to array and calculate growth
    const growthData: CommodityGrowthData[] = [];
    commodityMap.forEach((data, commodityId) => {
      const amountGrowth = data.currentAmount - data.previousAmount;
      const quantityGrowth = data.currentQuantity - data.previousQuantity;
      const amountGrowthPercent =
        data.previousAmount === 0
          ? 0
          : (amountGrowth / data.previousAmount) * 100;
      const quantityGrowthPercent =
        data.previousQuantity === 0
          ? 0
          : (quantityGrowth / data.previousQuantity) * 100;

      growthData.push({
        commodityId,
        commodityName: data.name,
        currentPeriod: currentPeriodLabel,
        previousPeriod: previousPeriodLabel,
        currentAmount: data.currentAmount,
        previousAmount: data.previousAmount,
        currentQuantity: data.currentQuantity,
        previousQuantity: data.previousQuantity,
        amountGrowth,
        quantityGrowth,
        amountGrowthPercent,
        quantityGrowthPercent,
      });
    });

    // Sort by amount growth percentage (descending)
    growthData.sort((a, b) => b.amountGrowthPercent - a.amountGrowthPercent);

    return {
      status: true,
      data: growthData,
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
    };
  }
};

export default CommoditySalesGrowth;
