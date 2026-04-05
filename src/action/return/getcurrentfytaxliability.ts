"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface GetCurrentFyTaxLiabilityPayload {
  dvatid: number;
}

const getFiscalYearStart = (date: Date): string => {
  const month = date.getMonth();
  const year = date.getFullYear();

  return month >= 6 ? year.toString() : (year - 1).toString();
};

const getCurrentFyTaxLiability = async (
  payload: GetCurrentFyTaxLiabilityPayload,
): Promise<ApiResponseType<number | null>> => {
  const functionname = getCurrentFyTaxLiability.name;

  try {
    const currentFinancialYear = getFiscalYearStart(new Date());

    const returnsData = await prisma.returns_01.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        file_status: "ACTIVE",
        dvat04Id: payload.dvatid,
        year: currentFinancialYear,
      },
      select: {
        vatamount: true,
        quarter: true,
      },
    });

    const taxLiability = returnsData.reduce((total, item) => {
      const value = Number.parseFloat(item.vatamount || "0");
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);

    return createResponse({
      message: "Current FY tax liability fetched successfully",
      functionname,
      data: taxLiability,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default getCurrentFyTaxLiability;