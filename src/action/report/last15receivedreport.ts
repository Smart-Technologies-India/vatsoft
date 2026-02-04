"use server";

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
}
const Last15ReceivedReport = async (
  payload: Last15ReceivedPayload
): Promise<ApiResponseType<ResponseData[] | null>> => {
  const functionname: string = Last15ReceivedReport.name;
  try {
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
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
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
        0
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
        0
      );

      const dvat04Where: any = {};
      
      if (payload.selectOffice) {
        dvat04Where.selectOffice = payload.selectOffice;
      }
      
      if (payload.selectCommodity === "FUEL") {
        dvat04Where.commodity = "FUEL";
      } else if (payload.selectCommodity === "LIQUOR") {
        dvat04Where.commodity = { not: "FUEL" };
      }

      const dayReceivedData = await prisma.returns_01.findMany({
        where: {
          dvat04: dvat04Where,
          deletedAt: null,
          deletedBy: null,
          OR: [
            {
              status: "LATE",
            },
            {
              status: "PAID",
            },
          ],
          transaction_date: {
            gte: day,
            lt: nextDay,
          },
        },
      });

      let totalAmountForDay = 0;
      for (let j = 0; j < dayReceivedData.length; j++) {
        totalAmountForDay += Math.max(0, parseInt(
          dayReceivedData[j].total_tax_amount == "" ||
            dayReceivedData[j].total_tax_amount == null ||
            dayReceivedData[j].total_tax_amount == undefined
            ? "0"
            : dayReceivedData[j].total_tax_amount ?? "0"
        ));
      }

      receivedDataArray.push({
        date: day,
        amount: Math.max(0, totalAmountForDay),
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
