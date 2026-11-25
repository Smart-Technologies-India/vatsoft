"use server";

import prisma from "@/../prisma/database";
import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";

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
  commodityType?: string;
  isAddItem?: boolean;
}): Promise<PayPurchaseByWalletLiquorResponse> => {
  try {
    const dvatId = await getCurrentDvatId();
    const currentUserId = await getCurrentUserId();

    if (!dvatId || !currentUserId) {
      return { status: false, message: "DVAT ID or User ID not found" };
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

    // Check if wallet has enough balance with epsilon tolerance for floating-point precision
    if (oldWallet < vatPayable - 0.01) {
      return {
        status: false,
        message: `Insufficient wallet balance. Available: ₹${oldWallet.toFixed(2)}, Required: ₹${vatPayable.toFixed(2)}`,
      };
    }

    // Calculate wallet deduction
    const walletDeduction = Math.min(oldWallet, vatPayable);
    const newWallet = oldWallet - walletDeduction;

    const invoiceNumberForHistory = input.isAddItem
      ? `${input.invoiceNo}-ADD`
      : input.invoiceNo;

    // Check if liquor_wallet_history already exists
    const is_exist_payment = await prisma.liquor_wallet_history.findFirst({
      where: {
        dvatId: dvatId,
        invoice_number: invoiceNumberForHistory,
        status: "ACTIVE",
        deletedAt: null,
      },
    });

    // If data already exists and isAddItem is false, return early without creating/updating
    if (is_exist_payment && !input.isAddItem) {
      return {
        status: true,
        message: "Payment record already exists. No changes made.",
        data: {
          old_wallet: oldWallet.toFixed(2),
          new_wallet: oldWallet.toFixed(2),
          wallet_deduction: "0.00",
        },
      };
    }

    // If data doesn't exist, proceed with creation and updates
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
          invoice_number: invoiceNumberForHistory,
          status: "ACTIVE",
          amount: walletDeduction.toFixed(2),
        },
      });
    }

    // Get purchase records to update stock
    const purchaseRecords = await prisma.daily_purchase.findMany({
      where: {
        dvat04Id: dvatId,
        invoice_number: input.invoiceNo,
        seller_tin_numberId: input.sellerId,
        deletedAt: null,
        deletedById: null,
      },
      select: {
        id: true,
        urn_number: true,
        commodity_masterId: true,
        quantity: true,
        commodity_master: {
          select: {
            pack_size: true,
          },
        },
      },
    });

    // Only update stock and other tables if this is a new payment or isAddItem is true
    if (!is_exist_payment || input.isAddItem) {
      // Update stock for each purchase record
      for (const record of purchaseRecords) {
        // For RESTAURANT commodity, multiply quantity by pack_size
        const quantityToAdd =
          input.commodityType === "RESTAURANT"
            ? record.quantity *
              (parseInt(record.commodity_master?.pack_size ?? "0", 10) || 0)
            : record.quantity;

        const existingStock = await prisma.stock.findFirst({
          where: {
            dvat04Id: dvatId,
            commodity_masterId: record.commodity_masterId,
            status: "ACTIVE",
            deletedAt: null,
            deletedById: null,
          },
          select: {
            id: true,
            quantity: true,
          },
        });

        const newQuantity = quantityToAdd + (existingStock?.quantity || 0);

        if (existingStock) {
          await prisma.stock.update({
            where: { id: existingStock.id },
            data: {
              quantity: newQuantity,
            },
          });
        } else {
          await prisma.stock.create({
            data: {
              quantity: newQuantity,
              commodity_masterId: record.commodity_masterId,
              dvat04Id: dvatId,
              status: "ACTIVE",
              createdById: currentUserId,
            },
          });
        }
      }

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
      const sellerdata = await prisma.tin_number_master.findUnique({
        where: { id: input.sellerId },
      });

      await prisma.transport_permit.deleteMany({
        where: {
          sellerDvatTinNumber: dvat04.tinNumber ?? "",
          purchaserDvatTinNumber: sellerdata?.tin_number ?? "",
          invoiceNumber: input.invoiceNo,
          status: "ACTIVE",
          is_paid: true,
        },
      });

      // Update transport_permit table for wallet payment
      await prisma.transport_permit.updateMany({
        where: {
          sellerDvatTinNumber: sellerdata?.tin_number ?? "",
          purchaserDvatTinNumber: dvat04.tinNumber ?? "",
          invoiceNumber: input.invoiceNo,
          status: "ACTIVE",
        },
        data: {
          is_paid: true,
          is_wallet: true,
          paid_date: new Date(),
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
    }

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
