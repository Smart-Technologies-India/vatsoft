"use server";

import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/../prisma/database";
import { ApiResponseType } from "@/models/response";

export interface AdminRefundRequestData {
  id: number;
  dvatId: number;
  returnId: number;
  itc_amount: string;
  cash_amount: string;
  remark: string | null;
  status: string;
  created_at: Date;
  dvat_name: string;
  dvat_tin: string;
  rr_number: string;
  return_month: string | null;
  return_quarter: string | null;
  return_year: string;
  return_status: string;
  total_tax_amount: string | null;
  filing_datetime: Date | null;
}

const GetAllWalletRefundRequests = async (): Promise<
  ApiResponseType<AdminRefundRequestData[]>
> => {
  const functionname = "GetAllWalletRefundRequests";

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
        deleted_at: null,
      },
      include: {
        dvat: true,
        returns_01: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedData: AdminRefundRequestData[] = walletRefunds.map(
      (refund: any) => ({
        id: refund.id,
        dvatId: refund.dvatId,
        returnId: refund.returnId,
        itc_amount: refund.itc_amount,
        cash_amount: refund.cash_amount,
        remark: refund.remark,
        status: refund.status,
        created_at: refund.created_at,
        dvat_name: refund.dvat?.name || "N/A",
        dvat_tin: refund.dvat?.tinNumber || "N/A",
        rr_number: refund.returns_01?.rr_number || "N/A",
        return_month: refund.returns_01?.month || null,
        return_quarter: (refund.returns_01?.quarter as string) || null,
        return_year: refund.returns_01?.year || "N/A",
        return_status: refund.returns_01?.status || "N/A",
        total_tax_amount: refund.returns_01?.total_tax_amount || null,
        filing_datetime: refund.returns_01?.filing_datetime || null,
      }),
    );

    return {
      status: true,
      data: formattedData,
      message: "All wallet refund requests retrieved successfully",
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

export default GetAllWalletRefundRequests;
