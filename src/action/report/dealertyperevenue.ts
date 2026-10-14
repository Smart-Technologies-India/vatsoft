"use server";
import { getCurrentUserId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface DealerTypeRevenuePayload {
  selectOffice?: "Dadra_Nagar_Haveli" | "DAMAN" | "DIU";
  year?: string;
  month?: string;
  quarter?: string;
}

interface MonthlyRevenue {
  month: string;
  fuelRevenue: number;
  liquorRevenue: number;
  oidcRevenue: number;
  manufacturerRevenue: number;
  wholesalerRevenue: number;
  restaurantRevenue: number;
  fuelDealers: number;
  liquorDealers: number;
  oidcDealers: number;
  manufacturerDealers: number;
  wholesalerDealers: number;
  restaurantDealers: number;
}

interface DealerTypeRevenueData {
  monthlyData: MonthlyRevenue[];
  totalFuelRevenue: number;
  totalLiquorRevenue: number;
  totalOidcRevenue: number;
  totalManufacturerRevenue: number;
  totalWholesalerRevenue: number;
  totalRestaurantRevenue: number;
  totalFuelDealers: number;
  totalLiquorDealers: number;
  totalOidcDealers: number;
  totalManufacturerDealers: number;
  totalWholesalerDealers: number;
  totalRestaurantDealers: number;
  fuelPercentage: number;
  liquorPercentage: number;
  oidcPercentage: number;
  manufacturerPercentage: number;
  wholesalerPercentage: number;
  restaurantPercentage: number;
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
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "DealerTypeRevenue",
      } as any;
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const selectedYear = payload.year || currentYear.toString();

    // Convert quarter to months
    const getMonthsForQuarter = (quarter: string): string[] => {
      const quarterMonthsMap: { [key: string]: string[] } = {
        Q1: ["April", "May", "June"],
        Q2: ["July", "August", "September"],
        Q3: ["October", "November", "December"],
        Q4: ["January", "February", "March"],
      };
      return quarterMonthsMap[quarter] || [];
    };

    // Build where clause for dvat04
    const dvatWhereClause: any = {};

    if (payload.selectOffice) {
      dvatWhereClause.selectOffice = payload.selectOffice;
    }

    // Build where clause for returns based on month or quarter
    const returnsWhereClause: any = {
      deletedAt: null,
      deletedById: null,
      status: "PAID",
      file_status: "ACTIVE",
      year: selectedYear,
    };

    if (payload.month) {
      returnsWhereClause.month = payload.month;
    } else if (payload.quarter) {
      const monthsInQuarter = getMonthsForQuarter(payload.quarter);
      returnsWhereClause.month = {
        in: monthsInQuarter,
      };
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

    const oidcDealersCount = await prisma.dvat04.count({
      where: {
        ...dvatWhereClause,
        commodity: "OIDC",
        status: "APPROVED",
      },
    });

    const manufacturerDealersCount = await prisma.dvat04.count({
      where: {
        ...dvatWhereClause,
        commodity: "MANUFACTURER",
        status: "APPROVED",
      },
    });

    const wholesalerDealersCount = await prisma.dvat04.count({
      where: {
        ...dvatWhereClause,
        commodity: "WHOLESALER",
        status: "APPROVED",
      },
    });

    const restaurantDealersCount = await prisma.dvat04.count({
      where: {
        ...dvatWhereClause,
        commodity: "RESTAURANT",
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
          deletedAt: null,
          deletedById: null,
        },
        ...returnsWhereClause,
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
          deletedAt: null,
          deletedById: null,
        },
        ...returnsWhereClause,
      },
      select: {
        month: true,
        vatamount: true,
      },
    });

    // Fetch revenue data for OIDC dealers
    const oidcReturns = await prisma.returns_01.findMany({
      where: {
        dvat04: {
          ...dvatWhereClause,
          commodity: "OIDC",
          status: "APPROVED",
          deletedAt: null,
          deletedById: null,
        },
        ...returnsWhereClause,
      },
      select: {
        month: true,
        vatamount: true,
      },
    });

    // Fetch revenue data for MANUFACTURER dealers
    const manufacturerReturns = await prisma.returns_01.findMany({
      where: {
        dvat04: {
          ...dvatWhereClause,
          commodity: "MANUFACTURER",
          status: "APPROVED",
          deletedAt: null,
          deletedById: null,
        },
        ...returnsWhereClause,
      },
      select: {
        month: true,
        vatamount: true,
      },
    });

    // Fetch revenue data for WHOLESALER dealers
    const wholesalerReturns = await prisma.returns_01.findMany({
      where: {
        dvat04: {
          ...dvatWhereClause,
          commodity: "WHOLESALER",
          status: "APPROVED",
          deletedAt: null,
          deletedById: null,
        },
        ...returnsWhereClause,
      },
      select: {
        month: true,
        vatamount: true,
      },
    });

    // Fetch revenue data for RESTAURANT dealers
    const restaurantReturns = await prisma.returns_01.findMany({
      where: {
        dvat04: {
          ...dvatWhereClause,
          commodity: "RESTAURANT",
          status: "APPROVED",
          deletedAt: null,
          deletedById: null,
        },
        ...returnsWhereClause,
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
        oidcRevenue: number;
        manufacturerRevenue: number;
        wholesalerRevenue: number;
        restaurantRevenue: number;
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
        oidcRevenue: 0,
        manufacturerRevenue: 0,
        wholesalerRevenue: 0,
        restaurantRevenue: 0,
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
        oidcRevenue: 0,
        manufacturerRevenue: 0,
        wholesalerRevenue: 0,
        restaurantRevenue: 0,
      };
      existing.fuelRevenue += Math.max(
        0,
        parseFloat(ret.vatamount || "0") < 0
          ? 0
          : parseFloat(ret.vatamount || "0"),
      );
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
        oidcRevenue: 0,
        manufacturerRevenue: 0,
        wholesalerRevenue: 0,
        restaurantRevenue: 0,
      };
      existing.liquorRevenue += Math.max(
        0,
        parseFloat(ret.vatamount || "0") < 0
          ? 0
          : parseFloat(ret.vatamount || "0"),
      );
      monthlyDataMap.set(monthNum, existing);
    });

    // Process OIDC returns
    oidcReturns.forEach((ret) => {
      let monthNum = ret.month || "00";
      if (monthNameToNumber[monthNum]) {
        monthNum = monthNameToNumber[monthNum];
      }

      const existing = monthlyDataMap.get(monthNum) || {
        fuelRevenue: 0,
        liquorRevenue: 0,
        oidcRevenue: 0,
        manufacturerRevenue: 0,
        wholesalerRevenue: 0,
        restaurantRevenue: 0,
      };
      existing.oidcRevenue += Math.max(
        0,
        parseFloat(ret.vatamount || "0") < 0
          ? 0
          : parseFloat(ret.vatamount || "0"),
      );
      monthlyDataMap.set(monthNum, existing);
    });

    // Process MANUFACTURER returns
    manufacturerReturns.forEach((ret) => {
      let monthNum = ret.month || "00";
      if (monthNameToNumber[monthNum]) {
        monthNum = monthNameToNumber[monthNum];
      }

      const existing = monthlyDataMap.get(monthNum) || {
        fuelRevenue: 0,
        liquorRevenue: 0,
        oidcRevenue: 0,
        manufacturerRevenue: 0,
        wholesalerRevenue: 0,
        restaurantRevenue: 0,
      };
      existing.manufacturerRevenue += Math.max(
        0,
        parseFloat(ret.vatamount || "0") < 0
          ? 0
          : parseFloat(ret.vatamount || "0"),
      );
      monthlyDataMap.set(monthNum, existing);
    });

    // Process WHOLESALER returns
    wholesalerReturns.forEach((ret) => {
      let monthNum = ret.month || "00";
      if (monthNameToNumber[monthNum]) {
        monthNum = monthNameToNumber[monthNum];
      }

      const existing = monthlyDataMap.get(monthNum) || {
        fuelRevenue: 0,
        liquorRevenue: 0,
        oidcRevenue: 0,
        manufacturerRevenue: 0,
        wholesalerRevenue: 0,
        restaurantRevenue: 0,
      };
      existing.wholesalerRevenue += Math.max(
        0,
        parseFloat(ret.vatamount || "0") < 0
          ? 0
          : parseFloat(ret.vatamount || "0"),
      );
      monthlyDataMap.set(monthNum, existing);
    });

    // Process RESTAURANT returns
    restaurantReturns.forEach((ret) => {
      let monthNum = ret.month || "00";
      if (monthNameToNumber[monthNum]) {
        monthNum = monthNameToNumber[monthNum];
      }

      const existing = monthlyDataMap.get(monthNum) || {
        fuelRevenue: 0,
        liquorRevenue: 0,
        oidcRevenue: 0,
        manufacturerRevenue: 0,
        wholesalerRevenue: 0,
        restaurantRevenue: 0,
      };
      existing.restaurantRevenue += Math.max(
        0,
        parseFloat(ret.vatamount || "0") < 0
          ? 0
          : parseFloat(ret.vatamount || "0"),
      );
      monthlyDataMap.set(monthNum, existing);
    });

    // Convert to array format
    const monthlyData: MonthlyRevenue[] = months.map((month) => {
      const data = monthlyDataMap.get(month) || {
        fuelRevenue: 0,
        liquorRevenue: 0,
        oidcRevenue: 0,
        manufacturerRevenue: 0,
        wholesalerRevenue: 0,
        restaurantRevenue: 0,
      };
      return {
        month: month,
        fuelRevenue: Math.max(0, data.fuelRevenue),
        liquorRevenue: Math.max(0, data.liquorRevenue),
        oidcRevenue: Math.max(0, data.oidcRevenue),
        manufacturerRevenue: Math.max(0, data.manufacturerRevenue),
        wholesalerRevenue: Math.max(0, data.wholesalerRevenue),
        restaurantRevenue: Math.max(0, data.restaurantRevenue),
        fuelDealers: Math.max(0, fuelDealersCount),
        liquorDealers: Math.max(0, liquorDealersCount),
        oidcDealers: Math.max(0, oidcDealersCount),
        manufacturerDealers: Math.max(0, manufacturerDealersCount),
        wholesalerDealers: Math.max(0, wholesalerDealersCount),
        restaurantDealers: Math.max(0, restaurantDealersCount),
      };
    });

    // Calculate totals
    const totalFuelRevenue = Math.max(
      0,
      monthlyData.reduce((sum, item) => sum + item.fuelRevenue, 0),
    );
    const totalLiquorRevenue = Math.max(
      0,
      monthlyData.reduce((sum, item) => sum + item.liquorRevenue, 0),
    );
    const totalOidcRevenue = Math.max(
      0,
      monthlyData.reduce((sum, item) => sum + item.oidcRevenue, 0),
    );
    const totalManufacturerRevenue = Math.max(
      0,
      monthlyData.reduce((sum, item) => sum + item.manufacturerRevenue, 0),
    );
    const totalWholesalerRevenue = Math.max(
      0,
      monthlyData.reduce((sum, item) => sum + item.wholesalerRevenue, 0),
    );
    const totalRestaurantRevenue = Math.max(
      0,
      monthlyData.reduce((sum, item) => sum + item.restaurantRevenue, 0),
    );
    const totalRevenue =
      totalFuelRevenue +
      totalLiquorRevenue +
      totalOidcRevenue +
      totalManufacturerRevenue +
      totalWholesalerRevenue +
      totalRestaurantRevenue;

    // Calculate percentages
    const fuelPercentage = Math.max(
      0,
      totalRevenue === 0 ? 0 : (totalFuelRevenue / totalRevenue) * 100,
    );
    const liquorPercentage = Math.max(
      0,
      totalRevenue === 0 ? 0 : (totalLiquorRevenue / totalRevenue) * 100,
    );
    const oidcPercentage = Math.max(
      0,
      totalRevenue === 0 ? 0 : (totalOidcRevenue / totalRevenue) * 100,
    );
    const manufacturerPercentage = Math.max(
      0,
      totalRevenue === 0 ? 0 : (totalManufacturerRevenue / totalRevenue) * 100,
    );
    const wholesalerPercentage = Math.max(
      0,
      totalRevenue === 0 ? 0 : (totalWholesalerRevenue / totalRevenue) * 100,
    );
    const restaurantPercentage = Math.max(
      0,
      totalRevenue === 0 ? 0 : (totalRestaurantRevenue / totalRevenue) * 100,
    );

    return {
      status: true,
      data: {
        monthlyData,
        totalFuelRevenue,
        totalLiquorRevenue,
        totalOidcRevenue,
        totalManufacturerRevenue,
        totalWholesalerRevenue,
        totalRestaurantRevenue,
        totalFuelDealers: fuelDealersCount,
        totalLiquorDealers: liquorDealersCount,
        totalOidcDealers: oidcDealersCount,
        totalManufacturerDealers: manufacturerDealersCount,
        totalWholesalerDealers: wholesalerDealersCount,
        totalRestaurantDealers: restaurantDealersCount,
        fuelPercentage,
        liquorPercentage,
        oidcPercentage,
        manufacturerPercentage,
        wholesalerPercentage,
        restaurantPercentage,
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
