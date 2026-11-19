"use server";

import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/../prisma/database";
import { ApiResponseType } from "@/models/response";

const RejectWalletRefund = async (payload: {
  walletRefundId: number;
  remark: string;
}): Promise<ApiResponseType<any>> => {
  const functionname = "RejectWalletRefund";

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

    // Get wallet refund details
    const walletRefund = await prisma.wallet_refund.findUnique({
      where: { id: payload.walletRefundId },
    });

    if (!walletRefund) {
      return {
        status: false,
        data: null,
        message: "Wallet refund not found",
        functionname,
      } as any;
    }

    if (walletRefund.status !== "DUE") {
      return {
        status: false,
        data: null,
        message: "Only DUE refund requests can be rejected",
        functionname,
      } as any;
    }

    // Update wallet refund status to REJECTED
    const updatedRefund = await prisma.wallet_refund.update({
      where: { id: payload.walletRefundId },
      data: {
        status: "REJECTED",
        remark: payload.remark,
      },
    });

    return {
      status: true,
      data: updatedRefund,
      message: "Refund request rejected successfully",
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

export default RejectWalletRefund;
