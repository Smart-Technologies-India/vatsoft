"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { DvatType } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetCurrentFyAnnualTurnoverPayload {
  dvatid: number;
}

const getFiscalYearStart = (date: Date): string => {
  const month = date.getMonth();
  const year = date.getFullYear();

  return month >= 6 ? year.toString() : (year - 1).toString();
};

const getCurrentFyAnnualTurnover = async (
  payload: GetCurrentFyAnnualTurnoverPayload,
): Promise<ApiResponseType<number | null>> => {
  const functionname = getCurrentFyAnnualTurnover.name;

  try {
    const currentFinancialYear = getFiscalYearStart(new Date());

    const entries = await prisma.returns_entry.findMany({
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
          dvat04Id: payload.dvatid,
          year: currentFinancialYear,
        },
      },
      select: {
        total_invoice_number: true,
      },
    });

    const annualTurnover = entries.reduce((total, entry) => {
      const value = Number.parseFloat(entry.total_invoice_number || "0");

      return total + (Number.isFinite(value) ? value : 0);
    }, 0);

    return createResponse({
      message: "Current FY annual turnover fetched successfully",
      functionname,
      data: annualTurnover,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default getCurrentFyAnnualTurnover;