"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import prisma from "@/../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";

export interface CreateWalletRefundPayload {
  dvatId: number;
  itc_amount: string;
  cash_amount: string;
  remark?: string;
}

const CreateWalletRefund = async (
  payload: CreateWalletRefundPayload
): Promise<ApiResponseType<any>> => {
  const functionname = "CreateWalletRefund";

  try {
    const currentUserId = await getCurrentUserId();
    const dvatId = await getCurrentDvatId();

    if (!currentUserId || !dvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    // Get DVAT details
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

    // Check if the required return is filed
    let filedReturn = null;

    if (dvat.frequencyFilings === "MONTHLY") {
      // Check for October 2026 filed return
      filedReturn = await prisma.returns_01.findFirst({
        where: {
          dvat04Id: payload.dvatId,
          month: "OCTOBER",
          year: "2026",
          file_status: "ACTIVE",
          status: { not: "DUE" },
          deletedAt: null,
        },
      });

      if (!filedReturn) {
        return {
          status: false,
          data: null,
          message:
            "October 2026 return must be filed before creating a refund request",
          functionname,
        } as any;
      }
    } else if (dvat.frequencyFilings === "QUARTERLY") {
      // Check for September 2026 filed return
      filedReturn = await prisma.returns_01.findFirst({
        where: {
          dvat04Id: payload.dvatId,
          month: "SEPTEMBER",
          year: "2026",
          file_status: "ACTIVE",
          status: { not: "DUE" },
          deletedAt: null,
        },
      });

      if (!filedReturn) {
        return {
          status: false,
          data: null,
          message:
            "September 2026 return must be filed before creating a refund request",
          functionname,
        } as any;
      }
    }

    // Get the most recent liquor wallet history entry for CREDIT type
    const walletHistory = await prisma.liquor_wallet_history.findFirst({
      where: {
        dvatId: payload.dvatId,
        type: "CREDIT",
        status: "ACTIVE",
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!walletHistory) {
      return {
        status: false,
        data: null,
        message: "No wallet credit history found",
        functionname,
      } as any;
    }

    // Create wallet refund entry
    if (!filedReturn) {
      return {
        status: false,
        data: null,
        message: "Filed return not found",
        functionname,
      } as any;
    }

    const walletRefund = await prisma.wallet_refund.create({
      data: {
        dvatId: payload.dvatId,
        liquor_wallet_historyId: walletHistory.id,
        returnId: filedReturn.id,
        itc_amount: payload.itc_amount,
        cash_amount: payload.cash_amount,
        remark: payload.remark || "",
        status: "DUE",
      },
    });

    return {
      status: true,
      data: walletRefund,
      message: "Refund request created successfully",
      functionname,
    } as any;
  } catch (error) {
    console.error(`Error in ${functionname}:`, error);
    return {
      status: false,
      data: null,
      message: error instanceof Error ? error.message : "Unknown error",
      functionname,
    } as any;
  }
};

export default CreateWalletRefund;
