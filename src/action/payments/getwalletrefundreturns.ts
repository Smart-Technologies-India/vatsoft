"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import prisma from "@/../prisma/database";
import { ApiResponseType } from "@/models/response";

export interface WalletRefundData {
  id: number;
  liquor_wallet_historyId: number | null;
  returnId: number;
  itc_amount: string;
  cash_amount: string;
  remark: string | null;
  status: string;
  invoice_number: string;
  amount: string;
  return_month: string | null;
  return_quarter: string | null;
  return_year: string | null;
  return_status: string;
  rr_number: string;
  filing_datetime: Date | null;
  total_tax_amount: string | null;
  dvat_name: string | null;
  dvat_tin: string | null;
  created_at: Date;
}

const GetWalletRefundReturns = async (): Promise<
  ApiResponseType<WalletRefundData[]>
> => {
  const functionname = "GetWalletRefundReturns";

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

    // Get all wallet refund requests with related data
    const walletRefunds = await prisma.wallet_refund.findMany({
      where: {
        dvatId: dvatId,
        deleted_at: null,
      },
      include: {
        liquor_wallet_history: true,
        returns_01: {
          include: {
            dvat04: true,
          },
        },
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
      return_quarter: (refund.returns_01?.quarter as string) || null,
      return_year: refund.returns_01?.year || null,
      return_status: refund.returns_01?.status || "N/A",
      rr_number: refund.returns_01?.rr_number || "N/A",
      filing_datetime: refund.returns_01?.filing_datetime || null,
      total_tax_amount: refund.returns_01?.total_tax_amount || null,
      dvat_name: refund.returns_01?.dvat04?.name || "N/A",
      dvat_tin: refund.returns_01?.dvat04?.tinNumber || "N/A",
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
