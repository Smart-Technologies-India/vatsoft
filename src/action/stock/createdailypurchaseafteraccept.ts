"use server";

import prisma from "../../../prisma/database";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";

interface CreateDailyPurchaseAfterAcceptInput {
  dvatid: number;
  seller_tin_id: number;
  commodityid: number;
  invoice_number: string;
  invoice_date: Date;
  quantity: number;
  amount_unit: string;
  amount: string;
  vatamount: string;
  tax_percent: string;
}

export default async function CreateDailyPurchaseAfterAccept(
  input: CreateDailyPurchaseAfterAcceptInput,
): Promise<ApiResponseType<any>> {
  const functionname = "CreateDailyPurchaseAfterAccept";
  try {
    const userId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!userId || !currentDvatId) {
      return createResponse({
        message: "Unauthorized access",
        functionname,
      });
    }

    // Verify DVAT ID matches current user's DVAT
    if (input.dvatid !== currentDvatId) {
      return createResponse({
        message: "DVAT not found or unauthorized",
        functionname,
      });
    }

    // Get seller TIN info
    const sellerTin = await prisma.tin_number_master.findFirst({
      where: {
        id: input.seller_tin_id,
        deletedAt: null,
      },
    });

    if (!sellerTin) {
      throw new Error("Seller TIN not found.");
    }

    // Create the daily purchase record (always create new, don't merge with existing)
    const dailyPurchase = await prisma.daily_purchase.create({
      data: {
        dvat04Id: input.dvatid,
        seller_tin_numberId: input.seller_tin_id,
        invoice_number: input.invoice_number,
        invoice_date: input.invoice_date,
        commodity_masterId: input.commodityid,
        quantity: input.quantity,
        tax_percent: input.tax_percent,
        amount: input.amount,
        amount_unit: input.amount_unit,
        vatamount: input.vatamount,
        is_dvat_30a: false,
        createdById: userId,
        is_local: sellerTin.tin_number.startsWith("25") ||
          sellerTin.tin_number.startsWith("26"),
        payment_status: "PAID",
      },
      include: {
        seller_tin_number: true,
      },
    });

    if (!dailyPurchase) {
      throw new Error("Failed to create daily purchase.");
    }

    return createResponse({
      message: "Item added successfully after payment",
      data: dailyPurchase,
      functionname,
    });
  } catch (error: any) {
    console.error("Error creating daily purchase after accept:", error);
    return createResponse({
      message: error.message || "Failed to add item",
      functionname,
    });
  }
}
