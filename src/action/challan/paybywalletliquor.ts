"use server";

import prisma from "@/../prisma/database";
import { getCurrentDvatId } from "@/lib/auth";

export interface PayByWalletLiquorResponse {
  status: boolean;
  message: string;
  data?: {
    old_wallet: string;
    new_wallet: string;
    wallet_deduction: string;
  };
}

export const PayByWalletLiquor = async (input: {
  totalAmount: string;
  invoiceNo: string;
  invoiceDate: Date;
  sellerId: number;
}): Promise<PayByWalletLiquorResponse> => {
  try {
    const dvatId = await getCurrentDvatId();

    if (!dvatId) {
      return { status: false, message: "DVAT ID not found" };
    }

    // Fetch DVAT04 wallet data
    const dvat04 = await prisma.dvat04.findUnique({
      where: { id: dvatId, deletedAt: null },
    });

    if (!dvat04) {
      return { status: false, message: "DVAT04 record not found" };
    }

    const oldWallet = parseFloat(dvat04.wallet || "0");
    const totalVat = parseFloat(input.totalAmount);

    // Check if wallet has enough balance
    if (oldWallet < totalVat) {
      return {
        status: false,
        message: `Insufficient wallet balance. Available: ₹${oldWallet.toFixed(2)}, Required: ₹${totalVat.toFixed(2)}`,
      };
    }

    // Calculate wallet deduction
    const walletDeduction = Math.min(oldWallet, totalVat);
    const newWallet = oldWallet - walletDeduction;

    const is_exist_payment = await prisma.liquor_wallet_history.findFirst({
      where: {
        dvatId: dvatId,
        invoice_number: input.invoiceNo,
        status: "ACTIVE",
      },
    });

    if (!is_exist_payment) {
      // Update DVAT04 wallet
      await prisma.dvat04.update({
        where: { id: dvatId, deletedAt: null },
        data: {
          wallet: newWallet.toFixed(2),
        },
      });

      // Create wallet history entry
      await prisma.liquor_wallet_history.create({
        data: {
          dvatId: dvatId,
          sellerId: input.sellerId,
          type: "DEBIT",
          old_wallet: oldWallet.toFixed(2),
          new_wallet: newWallet.toFixed(2),
          invoice_number: input.invoiceNo,
          status: "ACTIVE",
          amount: walletDeduction.toFixed(2),
        },
      });
    }

    await prisma.daily_sale.updateMany({
      where: {
        dvat04Id: dvatId,
        invoice_number: input.invoiceNo,
        seller_tin_numberId: input.sellerId,
        deletedAt: null,
        deletedBy: null,
      },
      data: {
        is_paid: true,
      },
    });

    const urn_respone = await prisma.daily_sale.findMany({
      where: {
        dvat04Id: dvatId,
        invoice_number: input.invoiceNo,
        seller_tin_numberId: input.sellerId,
        deletedAt: null,
        deletedBy: null,
      },
      select: {
        urn_number: true,
      },
    });

    const sellerdata = await prisma.tin_number_master.findUnique({
      where: { id: input.sellerId },
    });

    const is_paid = dvat04.commodity !== "WHOLESALER";

    // Update transport_permit table for wallet payment
    await prisma.transport_permit.create({
      data: {
        invoiceNumber: input.invoiceNo,
        invoiceDate: input.invoiceDate,
        sellerDvatTinNumber: dvat04.tinNumber ?? "",
        sellerDvatTradeName: dvat04.tradename ?? "",
        purchaserDvatTradeName: sellerdata?.name_of_dealer ?? "",
        purchaserDvatTinNumber: sellerdata?.tin_number ?? "",
        status: "ACTIVE",
        office: dvat04.selectOffice ?? "Dadra_Nagar_Haveli",
        items: urn_respone.length,
        is_paid: is_paid,
        is_wallet: is_paid,
        paid_date: is_paid ? new Date() : null,
      },
    });

    const urnNumbers: string[] = urn_respone
      .map((sale) => sale.urn_number)
      .filter(
        (val): val is string => val !== null && val !== undefined && val !== "",
      );
    await prisma.daily_purchase.updateMany({
      where: {
        urn_number: {
          in: urnNumbers,
        },
        deletedAt: null,
        deletedById: null,
      },
      data: {
        payment_status: "PAID",
      },
    });

    return {
      status: true,
      message: "Payment successful via wallet",
      data: {
        old_wallet: oldWallet.toFixed(2),
        new_wallet: newWallet.toFixed(2),
        wallet_deduction: walletDeduction.toFixed(2),
      },
    };
  } catch (error) {
    console.error("Error in PayByWalletLiquor:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
