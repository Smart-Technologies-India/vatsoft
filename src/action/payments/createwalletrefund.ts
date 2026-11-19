"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import prisma from "@/../prisma/database";
import { ApiResponseType } from "@/models/response";

export interface WalletRefundResponse {
  walletRefund: {
    id: number;
    status: string;
    created_at: Date;
  };
  returnDetails: {
    id: number;
    rr_number: string;
    month: string | null;
    quarter: string;
    year: string;
    status: string;
    vatamount: string | null;
    pending_payment: string | null;
    cash_payment: string | null;
  };
}

const CreateWalletRefund = async (): Promise<
  ApiResponseType<WalletRefundResponse>
> => {
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
      where: { id: dvatId, deletedAt: null },
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
          dvat04Id: dvatId,
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
          dvat04Id: dvatId,
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
        dvatId: dvatId,
        returnId: filedReturn.id,
        itc_amount: filedReturn.pending_payment ?? "0",
        cash_amount: filedReturn.cash_payment ?? "0",
        status: "DUE",
      },
    });

    // Format response with all details
    const responseData: WalletRefundResponse = {
      walletRefund: {
        id: walletRefund.id,
        status: walletRefund.status,
        created_at: walletRefund.created_at,
      },
      returnDetails: {
        id: filedReturn.id,
        rr_number: filedReturn.rr_number,
        month: filedReturn.month,
        quarter: filedReturn.quarter,
        year: filedReturn.year,
        status: filedReturn.status,
        vatamount: filedReturn.vatamount,
        pending_payment: filedReturn.pending_payment,
        cash_payment: filedReturn.cash_payment,
      },
    };

    return {
      status: true,
      data: responseData,
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
