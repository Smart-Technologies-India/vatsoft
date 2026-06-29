"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface PayRefinerySaleTaxPayload {
  id: number;
}

interface PayRefinerySaleTaxResult {
  updatedCount: number;
  invoiceNumber: string;
}

const PayRefinerySaleTax = async (
  payload: PayRefinerySaleTaxPayload,
): Promise<ApiResponseType<PayRefinerySaleTaxResult | null>> => {
  const functionname = PayRefinerySaleTax.name;

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

    const updated = await prisma.refinery_sale.updateMany({
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
      data: {
        refinery_status: "VATPAID",
        updatedById: currentUserId,
      },
    });

    return createResponse({
      message:
        updated.count > 0
          ? "Tax paid successfully. Status updated to VATPAID."
          : "Tax is already paid for this invoice.",
      functionname,
      data: {
        updatedCount: updated.count,
        invoiceNumber: targetSale.invoice_number,
      },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default PayRefinerySaleTax;
