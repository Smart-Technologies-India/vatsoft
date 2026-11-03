"use server";

import prisma from "@/../prisma/database";
import { getCurrentDvatId } from "@/lib/auth";

export interface PayPurchaseByWalletLiquorResponse {
  status: boolean;
  message: string;
  data?: {
    old_wallet: string;
    new_wallet: string;
    wallet_deduction: string;
  };
}

export const PayPurchaseByWalletLiquor = async (input: {
  vatPayable: string;
  invoiceNo: string;
  sellerId: number;
  invoiceDate: Date;
}): Promise<PayPurchaseByWalletLiquorResponse> => {
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
    const vatPayable = parseFloat(input.vatPayable);

    // Check if wallet has enough balance
    if (oldWallet < vatPayable) {
      return {
        status: false,
        message: `Insufficient wallet balance. Available: ₹${oldWallet.toFixed(2)}, Required: ₹${vatPayable.toFixed(2)}`,
      };
    }

    // Calculate wallet deduction
    const walletDeduction = Math.min(oldWallet, vatPayable);
    const newWallet = oldWallet - walletDeduction;

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
      },
    });

    // Update daily_purchase to mark as accepted and paid
    await prisma.daily_purchase.updateMany({
      where: {
        dvat04Id: dvatId,
        invoice_number: input.invoiceNo,
        seller_tin_numberId: input.sellerId,
        deletedAt: null,
        deletedById: null,
      },
      data: {
        is_accept: true,
        payment_status: "DEALER_PAID",
      },
    });

    // Get urn_numbers from updated daily_purchase records
    const purchaseRecords = await prisma.daily_purchase.findMany({
      where: {
        dvat04Id: dvatId,
        invoice_number: input.invoiceNo,
        seller_tin_numberId: input.sellerId,
        deletedAt: null,
        deletedById: null,
      },
      select: {
        urn_number: true,
      },
    });
    const sellerdata = await prisma.tin_number_master.findUnique({
      where: { id: input.sellerId },
    });

    // Update transport_permit table for wallet payment
    await prisma.transport_permit.create({
      data: {
        invoiceNumber: input.invoiceNo,
        invoiceDate: input.invoiceDate,
        sellerDvatTinNumber: dvat04.tinNumber ?? "",
        sellerDvatTradeName: dvat04.tradename ?? "",
        purchaserDvatTradeName: sellerdata?.name_of_dealer ?? "",
        purchaserDvatTinNumber: sellerdata?.tin_number ?? "",
        is_paid: true,
        is_wallet: true,
        paid_date: new Date(),
        status: "ACTIVE",
        items: purchaseRecords.length,
      },
    });

    const urnNumbers: string[] = purchaseRecords
      .map((record) => record.urn_number)
      .filter(
        (val): val is string => val !== null && val !== undefined && val !== "",
      );

    // Update daily_sale based on urn_numbers
    await prisma.daily_sale.updateMany({
      where: {
        urn_number: {
          in: urnNumbers,
        },
        deletedAt: null,
        deletedBy: null,
      },
      data: {
        is_accept: true,
        is_paid: true,
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
    console.error("Error in PayPurchaseByWalletLiquor:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
