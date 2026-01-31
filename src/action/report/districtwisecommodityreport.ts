"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { SelectOffice } from "@prisma/client";

function getDateMonthsAgo(date: Date, monthsAgo: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Calculate new month and year
  const newMonth = month - monthsAgo;
  const newDate = new Date(year, newMonth, 1); // handles negative months correctly
  return newDate;
}

interface DistrictWiseCommodityReportProps {
  office: string;
  month?: number;
  year?: number;
}

const DistrictWiseCommodityReport = async (
  props: DistrictWiseCommodityReportProps
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
  const functionname: string = DistrictWiseCommodityReport.name;
  try {
    const currentDate = new Date();
    const targetMonth = props.month ?? currentDate.getMonth() + 1;
    const targetYear = props.year ?? currentDate.getFullYear();

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
        createdBy: {
          selectOffice: props.office as SelectOffice,
        },
      },
      include: {
        createdBy: true,
      },
    });

    const commodityData = await prisma.commodity_master.findMany({
      where: {
        OR: [
          {
            product_type: "FUEL",
          },
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
        vatamount: number;
      }
    > = {};

    for (const entry of response) {
      const commodityId = entry.commodity_masterId;
      if (!commodityId) continue;

      const commodity = commodityData.find((c) => c.id === commodityId);
      if (!commodity) continue;

      const key = `${commodityId}`;

      if (!aggregationMap[key]) {
        aggregationMap[key] = {
          id: commodityId,
          name: commodity.product_name,
          office: props.office,
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
      aggregationMap[key].vatamount +=
        parseInt(entry.vatamount?.toString() ?? "0") || 0;
    }

    const filteredData = Object.values(aggregationMap).filter(
      (item) => item.office === props.office
    );

    const sorted = filteredData.sort((a, b) => b.total_amount - a.total_amount);

    const finalData = sorted.slice(0, 10);

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

export default DistrictWiseCommodityReport;
