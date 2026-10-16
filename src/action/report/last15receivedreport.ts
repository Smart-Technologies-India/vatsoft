"use server";
import { getCurrentUserId } from "@/lib/auth";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";

interface Last15ReceivedPayload {
  selectOffice?: SelectOffice;
  selectCommodity?: "FUEL" | "LIQUOR";
  filterType?: "MONTH" | "YEAR";
  month?: number;
  year?: number;
}

import prisma from "../../../prisma/database";
import { SelectOffice } from "@prisma/client";

interface ResponseData {
  date: Date; // Date object
  amount: number; // Total amount for the day
  fuelAmount?: number; // Fuel revenue for the day
  liquorAmount?: number; // Liquor revenue for the day
}
const Last15ReceivedReport = async (
  payload: Last15ReceivedPayload,
): Promise<ApiResponseType<ResponseData[] | null>> => {
  const functionname: string = Last15ReceivedReport.name;
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "Last15ReceivedReport",
      } as any;
    }

    const currentDate = new Date();

    // Determine the start and end dates based on filterType
    let startDate: Date;
    let endDate: Date;

    if (payload.year) {
      if (payload.filterType === "MONTH" && payload.month) {
        // Filter by specific month and year
        startDate = new Date(payload.year, payload.month - 1, 1, 0, 0, 0, 0);
        endDate = new Date(payload.year, payload.month, 0, 23, 59, 59, 999);
      } else {
        // Filter by year only
        startDate = new Date(payload.year, 0, 1, 0, 0, 0, 0);
        endDate = new Date(payload.year, 11, 31, 23, 59, 59, 999);
      }
    } else {
      // Default: current year
      const year = currentDate.getFullYear();
      startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    // Calculate the number of days in the date range
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysToShow = Math.min(daysDiff, 30); // Show max 30 days or all days in range

    // Create an array to store the result
    let receivedDataArray: ResponseData[] = [];

    // Iterate over the days
    for (let i = 0; i < daysToShow; i++) {
      const day = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate() - i,
        0,
        0,
        0,
        0,
      );

      // Skip if day is before start date
      if (day < startDate) continue;

      const nextDay = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate() + 1,
        0,
        0,
        0,
        0,
      );

      // Fetch Fuel data
      const fuelWhere: any = {
        commodity: "FUEL",
        deletedAt: null,
        deletedById: null,
      };

      if (payload.selectOffice) {
        fuelWhere.selectOffice = payload.selectOffice;
      }

      // Fetch Liquor data
      const liquorWhere: any = {
        commodity: { not: "FUEL" },
        deletedAt: null,
        deletedById: null,
      };

      if (payload.selectOffice) {
        liquorWhere.selectOffice = payload.selectOffice;
      }

      const challanWhereBase: any = {
        deletedAt: null,
        deletedById: null,
        paymentstatus: "PAID",
        transaction_date: {
          gte: day,
          lt: nextDay,
        },
      };

      let fuelData: any[] = [];
      let liquorData: any[] = [];

      // Get fuel data if not specifically filtered to liquor
      if (payload.selectCommodity !== "LIQUOR") {
        fuelData = await prisma.challan.findMany({
          where: {
            ...challanWhereBase,
            dvat: fuelWhere,
          },
        });
      }

      // Get liquor data if not specifically filtered to fuel
      if (payload.selectCommodity !== "FUEL") {
        liquorData = await prisma.challan.findMany({
          where: {
            ...challanWhereBase,
            dvat: liquorWhere,
          },
        });
      }

      let totalFuelAmount = 0;
      for (let j = 0; j < fuelData.length; j++) {
        totalFuelAmount += Math.max(
          0,
          parseInt(
            fuelData[j].total_tax_amount == "" ||
              fuelData[j].total_tax_amount == null ||
              fuelData[j].total_tax_amount == undefined
              ? "0"
              : (fuelData[j].total_tax_amount ?? "0"),
          ),
        );
      }

      let totalLiquorAmount = 0;
      for (let j = 0; j < liquorData.length; j++) {
        totalLiquorAmount += Math.max(
          0,
          parseInt(
            liquorData[j].total_tax_amount == "" ||
              liquorData[j].total_tax_amount == null ||
              liquorData[j].total_tax_amount == undefined
              ? "0"
              : (liquorData[j].total_tax_amount ?? "0"),
          ),
        );
      }

      const totalAmount = totalFuelAmount + totalLiquorAmount;

      receivedDataArray.push({
        date: day,
        amount: Math.max(0, totalAmount),
        fuelAmount: Math.max(0, totalFuelAmount),
        liquorAmount: Math.max(0, totalLiquorAmount),
      });
    }

    return createResponse({
      functionname: functionname,
      message: "Officer Dashboard data.",
      data: receivedDataArray,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default Last15ReceivedReport;
