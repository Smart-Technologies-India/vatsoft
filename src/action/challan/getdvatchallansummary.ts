"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";

interface DvatChallanSummary {
  total: number;
  totalAmount: string;
}

interface GetDvatChallanSummaryPayload {
  dvatid: number;
}

const GetDvatChallanSummary = async (
  payload: GetDvatChallanSummaryPayload,
): Promise<ApiResponseType<DvatChallanSummary | null>> => {
  const functionname: string = GetDvatChallanSummary.name;

  try {
    // Fetch all challans for this DVAT (no pagination)
    const allChallans = await prisma.challan.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        dvatid: payload.dvatid,
        paymentstatus: "PAID",
      },
    });

    const total = allChallans.length;
    const totalAmount = allChallans.reduce((sum, challan) => {
      const amount = Number.parseFloat(challan.total_tax_amount ?? "0") || 0;
      return sum + amount;
    }, 0);

    const summary: DvatChallanSummary = {
      total,
      totalAmount: totalAmount.toFixed(2),
    };

    return createResponse({
      message: "DVAT Challan summary retrieved successfully",
      functionname: functionname,
      data: summary,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetDvatChallanSummary;
