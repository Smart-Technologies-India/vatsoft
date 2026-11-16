"use server";

import prisma from "../../../prisma/database";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { customAlphabet } from "nanoid";

interface CreateDailySaleAfterAcceptInput {
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
  against_cfrom: boolean;
  is_against_fform: boolean;
  is_export: boolean;
  is_exempt: boolean;
  is_against_iform: boolean;
  is_h_export: boolean;
  is_against_e1: boolean;
  is_exempt6_2: boolean;
  is_accept: boolean;
  is_paid: boolean;
}

export default async function CreateDailySaleAfterAccept(
  input: CreateDailySaleAfterAcceptInput,
): Promise<ApiResponseType<any>> {
  const functionname = "CreateDailySaleAfterAccept";
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

    // Get seller DVAT info
    const sellerDvat = await prisma.dvat04.findFirst({
      where: {
        id: input.dvatid,
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!sellerDvat) {
      throw new Error("Seller DVAT not found.");
    }

    // Get purchaser TIN info
    const purchaserTin = await prisma.tin_number_master.findFirst({
      where: {
        id: input.seller_tin_id,
        deletedAt: null,
      },
    });

    if (!purchaserTin) {
      throw new Error("Purchaser TIN not found.");
    }

    // Check if stock exists
    const existingStock = await prisma.stock.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: input.dvatid,
        commodity_masterId: input.commodityid,
      },
      include: {
        commodity_master: true,
      },
    });

    if (!existingStock) {
      throw new Error("Stock does not exist.");
    }

    // Validate sufficient stock
    if (input.quantity > existingStock.quantity) {
      throw new Error(
        `Insufficient stock. You requested ${input.quantity}, but only ${existingStock.quantity} is available.`,
      );
    }

    const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstunvxyz", 12);
    const urnNumber = nanoid();

    // Create the daily sale record (always create new, don't merge with existing)
    const dailySale = await prisma.daily_sale.create({
      data: {
        invoice_number: input.invoice_number,
        invoice_date: input.invoice_date,
        quantity: input.quantity,
        amount_unit: input.amount_unit,
        amount: input.amount,
        vatamount: input.vatamount,
        tax_percent: input.tax_percent,
        dvat04Id: input.dvatid,
        seller_tin_numberId: input.seller_tin_id,
        commodity_masterId: input.commodityid,
        is_against_cform: input.against_cfrom,
        is_against_fform: input.is_against_fform,
        is_export: input.is_export,
        is_exempt: input.is_exempt,
        is_against_iform: input.is_against_iform,
        is_h_export: input.is_h_export,
        is_against_e1: input.is_against_e1,
        is_exempt6_2: input.is_exempt6_2,
        createdById: userId,
        is_dvat_31: false,
        is_local:
          purchaserTin.tin_number.startsWith("25") ||
          purchaserTin.tin_number.startsWith("26"),
        is_accept: input.is_accept,
        is_paid: input.is_paid,
        urn_number: urnNumber,
      },
      include: {
        seller_tin_number: true,
      },
    });

    if (!dailySale) {
      throw new Error("Failed to create daily sale.");
    }

    // Update stock quantity
    const updatedStock = await prisma.stock.update({
      where: {
        id: existingStock.id,
        deletedAt: null,
        deletedById: null,
      },
      data: {
        quantity: existingStock.quantity - input.quantity,
      },
    });

    if (!updatedStock) {
      throw new Error("Failed to update stock.");
    }

    // Get user (purchaser) DVAT info for creating purchase
    const purchaserDvat = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        tinNumber: dailySale.seller_tin_number.tin_number,
      },
    });

    // Create purchase record if purchaser is not a special case
    if (purchaserDvat) {
      if (
        purchaserTin.tin_number.startsWith("25") ||
        purchaserTin.tin_number.startsWith("26") ||
        ![1, 2, 821].includes(purchaserTin.id)
      ) {
        if (!sellerDvat.tinNumber) {
          throw new Error("Seller DVAT TIN number is missing.");
        }

        // Find seller TIN for purchase creation
        const sellerTin = await prisma.tin_number_master.findFirst({
          where: {
            status: "ACTIVE",
            deletedAt: null,
            tin_number: sellerDvat.tinNumber,
          },
        });

        if (!sellerTin) {
          throw new Error("Seller TIN number not found.");
        }

        const ispaid = input.invoice_date < new Date("2026-11-01");

        // Check if daily purchase entry already exists
        const existingDailyPurchase = await prisma.daily_purchase.findFirst({
          where: {
            dvat04Id: purchaserDvat.id,
            seller_tin_numberId: sellerTin.id,
            invoice_number: input.invoice_number,
            commodity_masterId: input.commodityid,
            deletedAt: null,
            deletedById: null,
          },
        });

        // Always create new daily purchase entry (don't merge with existing)
        const dailyPurchase = await prisma.daily_purchase.create({
          data: {
            dvat04Id: purchaserDvat.id,
            seller_tin_numberId: sellerTin.id,
            invoice_number: input.invoice_number,
            invoice_date: input.invoice_date,
            commodity_masterId: input.commodityid,
            quantity: input.quantity,
            tax_percent: input.tax_percent,
            amount: input.amount,
            amount_unit: input.amount_unit,
            vatamount: input.vatamount,
            urn_number: urnNumber,
            is_dvat_30a: !(
              sellerDvat.tinNumber.startsWith("25") ||
              sellerDvat.tinNumber.startsWith("26")
            ),
            createdById: userId,
            is_local:
              sellerDvat.tinNumber.startsWith("25") ||
              sellerDvat.tinNumber.startsWith("26"),
            payment_status: "PAID",
          },
        });

        if (!dailyPurchase) {
          throw new Error("Failed to create daily purchase.");
        }
      }
    }

    return createResponse({
      message: "Item added successfully after payment",
      data: dailySale,
      functionname,
    });
  } catch (error: any) {
    console.error("Error creating daily sale after accept:", error);
    return createResponse({
      message: error.message || "Failed to add item",
      functionname,
    });
  }
}
