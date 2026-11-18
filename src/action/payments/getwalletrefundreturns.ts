"use server";

import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/../prisma/database";
import { ApiResponseType } from "@/models/response";

export interface WalletRefundData {
  id: number;
  liquor_wallet_historyId: number;
  returnId: number;
  itc_amount: string;
  cash_amount: string;
  remark: string | null;
  status: string;
  invoice_number: string;
  amount: string;
  return_month: string | null;
  return_quarter: string | null;
  created_at: Date;
}

const GetWalletRefundReturns = async (payload: {
  dvatId: number;
}): Promise<ApiResponseType<WalletRefundData[]>> => {
  const functionname = "GetWalletRefundReturns";

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

    // Get all wallet refund requests with related data
    const walletRefunds = await prisma.wallet_refund.findMany({
      where: {
        dvatId: payload.dvatId,
        deleted_at: null,
      },
      include: {
        liquor_wallet_history: true,
        returns_01: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedData: WalletRefundData[] = walletRefunds.map((refund) => ({
      id: refund.id,
      liquor_wallet_historyId: refund.liquor_wallet_historyId,
      returnId: refund.returnId,
      itc_amount: refund.itc_amount,
      cash_amount: refund.cash_amount,
      remark: refund.remark,
      status: refund.status,
      invoice_number: refund.liquor_wallet_history?.invoice_number || "N/A",
      amount: refund.liquor_wallet_history?.amount || "0",
      return_month: refund.returns_01?.month || null,
      return_quarter: refund.returns_01?.quarter || null,
      created_at: refund.created_at,
    }));

    return {
      status: true,
      data: formattedData,
      message: "Wallet refund returns retrieved successfully",
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

export default GetWalletRefundReturns;
