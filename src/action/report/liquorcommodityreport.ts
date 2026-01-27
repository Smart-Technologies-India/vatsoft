"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

function getDateMonthsAgo(date: Date, monthsAgo: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Calculate new month and year
  const newMonth = month - monthsAgo;
  const newDate = new Date(year, newMonth, 1); // handles negative months correctly
  return newDate;
}

const LiquorCommodityReport = async (
  month?: number,
  year?: number,
): Promise<
  ApiResponseType<Array<{
    id: number;
    name: string;
    total_quantity: number;
    total_amount: number;
    count: number;
    office: string;
  }> | null>
> => {
  const functionname: string = LiquorCommodityReport.name;
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
      },
      include: {
        createdBy: true,
      },
    });

    if (response.length === 0) {
      return createResponse({
        functionname: functionname,
        message: "No data found for the specified period.",
        data: null,
      });
    }

    const commodityData = await prisma.commodity_master.findMany({
      where: {
        OR: [
          {
            product_type: "LIQUOR",
          },
          {
            product_type: "MANUFACTURER",
          },
          {
            product_type: "OIDC",
          },
        ],
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
    });

    if (commodityData.length === 0) {
      return createResponse({
        functionname: functionname,
        message: "No active liquor commodities found.",
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
        };
      }

      aggregationMap[key].total_quantity += entry.quantity || 0;
      aggregationMap[key].total_amount +=
        parseInt(entry.total_invoice_number?.toString() ?? "0") || 0;
      aggregationMap[key].count += 1;
    }

    const groupedByOffice: Record<string, (typeof aggregationMap)[string][]> =
      {};

    for (const item of Object.values(aggregationMap)) {
      if (!groupedByOffice[item.office]) {
        groupedByOffice[item.office] = [];
      }
      groupedByOffice[item.office].push(item);
    }

    const finalData: (typeof aggregationMap)[string][] = [];

    for (const office in groupedByOffice) {
      const sorted = groupedByOffice[office].sort(
        (a, b) => b.total_amount - a.total_amount
      );
      finalData.push(...sorted.slice(0, 10));
    }

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

export default LiquorCommodityReport;
