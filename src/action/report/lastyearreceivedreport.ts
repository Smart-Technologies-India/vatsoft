"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString, isNegative } from "@/utils/methods";

interface LastYearReceivedPayload {
  selectOffice?: SelectOffice;
  selectCommodity?: "FUEL" | "LIQUOR";
}

import prisma from "../../../prisma/database";
import { SelectOffice } from "@prisma/client";

interface ResponseData {
  monthYear: string; // Month and year in "MMM-yyyy" format
  amount: number; // Total amount for the month
}

const LastYearReceived = async (
  payload: LastYearReceivedPayload,
): Promise<ApiResponseType<ResponseData[] | null>> => {
  const functionname: string = LastYearReceived.name;
  try {
    const currentDate = new Date();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    // Create an array to store the result for the last 12 months
    let receivedDataArray: ResponseData[] = [];

    // Iterate over the last 12 months
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 1);

      const dvat04Where: any = {};

      if (payload.selectOffice) {
        dvat04Where.selectOffice = payload.selectOffice;
      }

      if (payload.selectCommodity === "FUEL") {
        dvat04Where.commodity = "FUEL";
      } else if (payload.selectCommodity === "LIQUOR") {
        dvat04Where.commodity = { not: "FUEL" };
      }
      // If selectCommodity is undefined, don't filter by commodity (all)

      const monthReceivedData = await prisma.returns_01.findMany({
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
            gte: startDate,
            lt: endDate,
          },
        },
      });

      let totalAmountForMonth = 0;
      for (let j = 0; j < monthReceivedData.length; j++) {
        totalAmountForMonth += Math.max(
          0,
          parseInt(
            monthReceivedData[j].total_tax_amount == "" ||
              monthReceivedData[j].total_tax_amount == null ||
              monthReceivedData[j].total_tax_amount == undefined
              ? "0"
              : (monthReceivedData[j].total_tax_amount ?? "0"),
          ),
        );
      }

      receivedDataArray.push({
        monthYear: `${monthNames[month]}-${year}`,
        amount: isNegative(totalAmountForMonth) ? 0 : totalAmountForMonth,
      });
    }

    // Reverse the array to have the data in chronological order (oldest to newest)
    receivedDataArray.reverse();

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

export default LastYearReceived;
