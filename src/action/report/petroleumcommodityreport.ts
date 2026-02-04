"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import { returns_entry } from "@prisma/client";

function getDateMonthsAgo(date: Date, monthsAgo: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Calculate new month and year
  const newMonth = month - monthsAgo;
  const newDate = new Date(year, newMonth, 1); // handles negative months correctly
  return newDate;
}

const PetroleumCommodityReport = async (
  month?: number,
  year?: number,
  selectOffice?: SelectOffice,
): Promise<
  ApiResponseType<Array<{
    id: number;
    name: string;
    total_quantity: number;
    total_amount: number;
    count: number;
    office: string;
    vatamount: number;
  }> | null>
> => {
  const functionname: string = PetroleumCommodityReport.name;
  try {
    const currentDate = new Date();
    const targetMonth = month ?? currentDate.getMonth() + 1;
    const targetYear = year ?? currentDate.getFullYear();

    const firstDateOfMonth = new Date(targetYear, targetMonth - 1, 2);
    const lastDateOfMonth = new Date(targetYear, targetMonth, 1);

    const response = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        invoice_date: {
          gte: firstDateOfMonth,
          lt: lastDateOfMonth,
        },
        ...(selectOffice && {
          returns_01: {
            dvat04: {
              selectOffice: selectOffice,
            },
          },
        }),
      },
      include: {
        createdBy: true,
      },
    });

    if (response.length == 0) {
      return createResponse({
        functionname: functionname,
        message: "No data found for the specified period.",
        data: null,
      });
    }

    const commodityData = await prisma.commodity_master.findMany({
      where: {
        product_type: "FUEL",
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
    });

    if (commodityData.length === 0) {
      return createResponse({
        functionname: functionname,
        message: "No active petroleum commodities found.",
        data: null,
      });
    }

    const aggregationMap: Record<
      string,
      {
        id: number;
        name: string;
        office: string;
        total_quantity: number;
        total_amount: number;
        count: number;
        vatamount: number;
      }
    > = {};

    for (const entry of response) {
      const commodityId = entry.commodity_masterId;
      const userOffice = entry.createdBy?.selectOffice;
      if (!commodityId || !userOffice) continue;

      const commodity = commodityData.find((c) => c.id === commodityId);
      if (!commodity) continue;

      const key = `${commodityId}_${userOffice}`;

      if (!aggregationMap[key]) {
        aggregationMap[key] = {
          id: commodityId,
          name: commodity.product_name,
          office: userOffice,
          total_quantity: 0,
          total_amount: 0,
          count: 0,
          vatamount: 0,
        };
      }

      aggregationMap[key].total_quantity += entry.quantity || 0;
      aggregationMap[key].total_amount +=
        parseInt(entry.total_invoice_number?.toString() ?? "0") || 0;
      aggregationMap[key].count += 1;
      aggregationMap[key].vatamount += Math.max(
        0,
        parseInt(entry.vatamount?.toString() ?? "0"),
      );
    }

    const finalData = Object.values(aggregationMap);

    return createResponse({
      functionname,
      message: "Officer Dashboard data.",
      data: finalData,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default PetroleumCommodityReport;
