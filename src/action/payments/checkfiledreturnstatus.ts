"use server";

import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/../prisma/database";
import { ApiResponseType } from "@/models/response";

export interface FiledReturnStatusData {
  id: number;
  month: string | null;
  quarter: string;
  year: string;
  status: string;
  rr_number: string;
  pending_payment?: string | null;
  cash_payment?: string | null;
}

const CheckFiledReturnStatus = async (payload: {
  dvatId: number;
}): Promise<ApiResponseType<FiledReturnStatusData>> => {
  const functionname = "CheckFiledReturnStatus";

  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    // Get DVAT details to determine frequency
    const dvat = await prisma.dvat04.findUnique({
      where: { id: payload.dvatId, deletedAt: null },
    });

    if (!dvat) {
      return {
        status: false,
        data: null,
        message: "DVAT record not found",
        functionname,
      } as any;
    }

    let filedReturn = null;

    if (dvat.frequencyFilings === "MONTHLY") {
      // Check for October 2026 return (October should be filed for monthly)
      filedReturn = await prisma.returns_01.findFirst({
        where: {
          dvat04Id: payload.dvatId,
          month: "OCTOBER",
          year: "2026",
          deletedAt: null,
        },
        select: {
          id: true,
          month: true,
          quarter: true,
          year: true,
          status: true,
          rr_number: true,
          pending_payment: true,
          cash_payment: true,
        },
      });
    } else if (dvat.frequencyFilings === "QUARTERLY") {
      // Check for September 2026 return (September should be filed for quarterly)
      filedReturn = await prisma.returns_01.findFirst({
        where: {
          dvat04Id: payload.dvatId,
          month: "SEPTEMBER",
          year: "2026",
          deletedAt: null,
        },
        select: {
          id: true,
          month: true,
          quarter: true,
          year: true,
          status: true,
          rr_number: true,
          pending_payment: true,
          cash_payment: true,
        },
      });
    }

    if (!filedReturn) {
      return {
        status: false,
        data: null,
        message: "No filed return found",
        functionname,
      } as any;
    }

    return {
      status: true,
      data: filedReturn as FiledReturnStatusData,
      message: "Filed return status retrieved successfully",
      functionname,
    } as any;
  } catch (error) {
    return {
      status: false,
      data: null,
      message: error instanceof Error ? error.message : "Unknown error",
      functionname,
    } as any;
  }
};

export default CheckFiledReturnStatus;
