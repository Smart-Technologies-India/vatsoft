"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { DvatType } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetCurrentFyMetricsBulkPayload {
  dvatids: number[];
  fyStartYear?: string;
}

interface CurrentFyMetricsRow {
  dvatid: number;
  annualTurnover: number;
  taxLiability: number;
  hasTurnoverData: boolean;
}

const getFiscalYearStart = (date: Date): string => {
  const month = date.getMonth();
  const year = date.getFullYear();

  // Show previous FY metrics until June 30. From July 1, show current FY.
  return month >= 6 ? year.toString() : (year - 1).toString();
};

const getCurrentFyMetricsBulk = async (
  payload: GetCurrentFyMetricsBulkPayload,
): Promise<ApiResponseType<CurrentFyMetricsRow[] | null>> => {
  const functionname = getCurrentFyMetricsBulk.name;

  try {
    const dvatids = Array.from(
      new Set((payload.dvatids || []).filter((id) => Number.isInteger(id))),
    );

    if (dvatids.length === 0) {
      return createResponse({
        message: "No dealer ids provided",
        functionname,
        data: [],
      });
    }

    const currentFinancialYear =
      payload.fyStartYear && /^\d{4}$/.test(payload.fyStartYear)
        ? payload.fyStartYear
        : getFiscalYearStart(new Date());

    const [returnsEntries, returnsData] = await Promise.all([
      prisma.returns_entry.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          dvat_type: {
            in: [DvatType.DVAT_31, DvatType.DVAT_31_A],
          },
          returns_01: {
            deletedAt: null,
            deletedById: null,
            dvat04Id: {
              in: dvatids,
            },
            year: currentFinancialYear,
          },
        },
        select: {
          total_invoice_number: true,
          returns_01: {
            select: {
              dvat04Id: true,
            },
          },
        },
      }),
      prisma.returns_01.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          file_status: "ACTIVE",
          dvat04Id: {
            in: dvatids,
          },
          year: currentFinancialYear,
        },
        select: {
          dvat04Id: true,
          vatamount: true,
        },
      }),
    ]);

    const annualTurnoverMap = new Map<number, number>();
    const taxLiabilityMap = new Map<number, number>();

    for (const entry of returnsEntries) {
      const dvatid = entry.returns_01.dvat04Id;
      const value = Number.parseFloat(entry.total_invoice_number || "0");
      const safeValue = Number.isFinite(value) ? value : 0;

      annualTurnoverMap.set(
        dvatid,
        (annualTurnoverMap.get(dvatid) || 0) + safeValue,
      );
    }

    for (const item of returnsData) {
      const value = Number.parseFloat(item.vatamount || "0");
      const safeValue = Number.isFinite(value) ? value : 0;

      taxLiabilityMap.set(
        item.dvat04Id,
        (taxLiabilityMap.get(item.dvat04Id) || 0) + safeValue,
      );
    }

    const data: CurrentFyMetricsRow[] = dvatids.map((dvatid) => ({
      dvatid,
      annualTurnover: annualTurnoverMap.get(dvatid) || 0,
      taxLiability: taxLiabilityMap.get(dvatid) || 0,
      hasTurnoverData: annualTurnoverMap.has(dvatid),
    }));

    return createResponse({
      message: "Current FY metrics fetched successfully",
      functionname,
      data,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default getCurrentFyMetricsBulk;
