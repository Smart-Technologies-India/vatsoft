"use server";

import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/../prisma/database";
import { ApiResponseType } from "@/models/response";

const ApproveWalletRefund = async (payload: {
  walletRefundId: number;
  remark: string;
}): Promise<ApiResponseType<any>> => {
  const functionname = "ApproveWalletRefund";

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
      include: {
        returns_01: true,
      },
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
        message: "Only DUE refund requests can be approved",
        functionname,
      } as any;
    }

    // Get DVAT details
    const dvat = await prisma.dvat04.findUnique({
      where: { id: walletRefund.dvatId },
    });

    if (!dvat) {
      return {
        status: false,
        data: null,
        message: "DVAT record not found",
        functionname,
      } as any;
    }

    const itcAmount = parseFloat(walletRefund.itc_amount || "0");
    const cashAmount = parseFloat(walletRefund.cash_amount || "0");
    const totalAmount = itcAmount + cashAmount;

    // Update in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current wallet balance
      const currentWallet = dvat.wallet ?? "0";
      const currentWalletAmount = parseFloat(currentWallet);
      const newWalletAmount = currentWalletAmount + totalAmount;

      // Create liquor_wallet_history entry
      const walletHistory = await tx.liquor_wallet_history.create({
        data: {
          dvatId: walletRefund.dvatId,
          sellerId: dvat.tin_master_id ?? 1,
          type: "CREDIT",
          old_wallet: currentWallet,
          new_wallet: newWalletAmount.toString(),
          amount: totalAmount.toString(),
          invoice_number: `REFUND-${payload.walletRefundId}`,
          status: "ACTIVE",
        },
      });

      // Update wallet refund status to APPROVED and link to wallet history
      const updatedRefund = await tx.wallet_refund.update({
        where: { id: payload.walletRefundId },
        data: {
          status: "APPROVED",
          remark: payload.remark,
          liquor_wallet_historyId: walletHistory.id,
          acceptedbyId: currentUserId,
        },
      });

      // Update DVAT04 wallet column (add the total amount)
      const updatedDvat = await tx.dvat04.update({
        where: { id: walletRefund.dvatId },
        data: {
          wallet: newWalletAmount.toString(),
        },
      });

      return {
        refund: updatedRefund,
        dvat: updatedDvat,
        walletHistory: walletHistory,
      };
    });

    return {
      status: true,
      data: result,
      message: "Refund request approved successfully",
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

export default ApproveWalletRefund;
