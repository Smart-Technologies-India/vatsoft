"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";

interface Last15ReceivedPayload {
  selectOffice?: SelectOffice;
  selectCommodity?: "FUEL" | "LIQUOR";
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

    // Create an array to store the result for the last 15 days including today
    let receivedDataArray: ResponseData[] = [];

    // Iterate over the last 15 days (including today)
    for (let i = 0; i <= 15; i++) {
      const day = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() - i,
        0,
        0,
        0,
        0
      );
      const nextDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() - i + 1,
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
