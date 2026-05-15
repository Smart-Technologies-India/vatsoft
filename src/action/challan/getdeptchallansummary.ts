"use server";

import { errorToString } from "@/utils/methods";
import { SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import { createResponse, type ApiResponseType } from "@/models/response";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

interface GetDeptChallanSummaryPayload {
  dept: SelectOffice;
}

type DeptChallanSummary = {
  today: number;
  last7Days: number;
  last15Days: number;
  last30Days: number;
};

const parseAmount = (value: string | null | undefined) =>
  Number.parseFloat(value ?? "0") || 0;

const GetDeptChallanSummary = async (
  payload: GetDeptChallanSummaryPayload,
): Promise<ApiResponseType<DeptChallanSummary | null>> => {
  const functionname: string = GetDeptChallanSummary.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const last7DaysStart = new Date(todayStart);
    last7DaysStart.setDate(last7DaysStart.getDate() - 7);

    const last15DaysStart = new Date(todayStart);
    last15DaysStart.setDate(last15DaysStart.getDate() - 15);

    const last30DaysStart = new Date(todayStart);
    last30DaysStart.setDate(last30DaysStart.getDate() - 30);

    const paidChallans = await prisma.challan.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        paymentstatus: "PAID",
        dvat: {
          selectOffice: payload.dept,
        },
        createdAt: {
          gte: last30DaysStart,
          lte: now,
        },
      },
      select: {
        total_tax_amount: true,
        createdAt: true,
      },
    });

    let today = 0;
    let last7Days = 0;
    let last15Days = 0;
    let last30Days = 0;

    for (const challan of paidChallans) {
      const challanDate = new Date(challan.createdAt);
      challanDate.setHours(0, 0, 0, 0);
      const amount = parseAmount(challan.total_tax_amount);

      if (challanDate.getTime() >= todayStart.getTime()) {
        today += amount;
      }
      if (challanDate.getTime() >= last7DaysStart.getTime()) {
        last7Days += amount;
      }
      if (challanDate.getTime() >= last15DaysStart.getTime()) {
        last15Days += amount;
      }
      if (challanDate.getTime() >= last30DaysStart.getTime()) {
        last30Days += amount;
      }
    }

    return createResponse({
      message: "Department challan summary fetched successfully.",
      functionname,
      data: {
        today,
        last7Days,
        last15Days,
        last30Days,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
      data: null,
    });
  }
};

export default GetDeptChallanSummary;
