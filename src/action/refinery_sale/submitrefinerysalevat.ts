"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";
import { Quarter } from "@prisma/client";

interface SubmitRefinerySaleVatPayload {
  id: number;
  payableAmount: number;
  totalVatAmount: number;
  walletAmount: number;
}

interface SubmitRefinerySaleVatResult {
  message: string;
}

const SubmitRefinerySaleVat = async (
  payload: SubmitRefinerySaleVatPayload,
): Promise<ApiResponseType<SubmitRefinerySaleVatResult | null>> => {
  const functionname = SubmitRefinerySaleVat.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const currentDvat = await prisma.dvat04.findFirst({
      where: {
        id: currentDvatId,
        deletedAt: null,
        deletedById: null,
      },
      select: {
        tin_master_id: true,
      },
    });

    if (!currentDvat) {
      return createResponse({
        message: "Current DVAT profile not found.",
        functionname,
      });
    }

    const targetSale = await prisma.refinery_sale.findFirst({
      where: {
        id: payload.id,
        seller_tin_numberId: currentDvat.tin_master_id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        invoice_number: true,
        invoice_date: true,
        refineryId: true,
        seller_tin_numberId: true,
      },
    });

    if (!targetSale) {
      return createResponse({
        message: "Invoice not found for current DVAT.",
        functionname,
      });
    }

    const saleRows = await prisma.refinery_sale.findMany({
      where: {
        invoice_number: targetSale.invoice_number,
        invoice_date: targetSale.invoice_date,
        refineryId: targetSale.refineryId,
        seller_tin_numberId: targetSale.seller_tin_numberId,
        refinery_status: "SALE",
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      select: {
        vatamount: true,
      },
    });

    if (saleRows.length === 0) {
      return createResponse({
        message: "Tax is already paid for this invoice.",
        functionname,
      });
    }

    if (payload.payableAmount < 0 || payload.totalVatAmount < 0) {
      return createResponse({
        message: "Invalid VAT or payable amount.",
        functionname,
      });
    }

    // Update wallet and create wallet history entry
    const currentDvatBeforeUpdate = await prisma.dvat04.findUnique({
      where: { id: currentDvatId },
      select: { wallet: true, tin_master_id: true },
    });

    if (!currentDvatBeforeUpdate) {
      return createResponse({
        message: "Failed to retrieve current wallet amount.",
        functionname,
      });
    }

    const oldWallet = Number.parseFloat(currentDvatBeforeUpdate.wallet || "0");
    const newWallet = oldWallet - payload.payableAmount;

    // Update wallet in dvat04
    await prisma.dvat04.update({
      where: { id: currentDvatId },
      data: {
        wallet: newWallet.toFixed(2),
        updatedById: currentUserId,
      },
    });

    // Create wallet history entry
    await prisma.wallet_history.create({
      data: {
        dvatId: currentDvatId,
        refineryId: targetSale.refineryId,
        type: payload.payableAmount > 0 ? "DEBIT" : "CREDIT",
        status: "ACTIVE",
        difference_amount: payload.payableAmount.toFixed(2),
        old_wallet: oldWallet.toFixed(2),
        new_wallet: newWallet.toFixed(2),
        old_quantity: "0",
        new_quantity: "0",
        old_amount: payload.totalVatAmount.toFixed(2),
        new_amount: payload.payableAmount.toFixed(2),
        invoice_number: targetSale.invoice_number,
      },
    });

    return createResponse({
      message: "Refinery VAT submitted successfully.",
      functionname,
      data: {
        message: "Refinery VAT submitted successfully.",
      },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default SubmitRefinerySaleVat;
