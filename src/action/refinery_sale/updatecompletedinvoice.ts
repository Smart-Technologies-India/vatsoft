"use server";

import { getCurrentRefineryId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";
import { parse, isValid } from "date-fns";

export interface UpdateCompletedInvoicePayload {
  id: number; // refinery_sale id
  invoice_number: string;
  invoice_date: string; // dd/MM/yyyy
  cst_purchase: string;
}

const UpdateCompletedInvoice = async (
  payload: UpdateCompletedInvoicePayload,
): Promise<ApiResponseType<null>> => {
  const functionname = UpdateCompletedInvoice.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentRefineryId = await getCurrentRefineryId();
    if (!currentRefineryId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const refinery = await prisma.refinery.findFirst({
      where: { deletedAt: null, id: currentRefineryId },
    });

    if (!refinery) {
      return createResponse({
        message: "No refinery profile found.",
        functionname,
      });
    }

    const targetSale = await prisma.refinery_sale.findFirst({
      where: {
        id: payload.id,
        refineryId: refinery.id,
        deletedAt: null,
        status: "ACTIVE",
        refinery_status: "COMPLETED",
      },
    });

    if (!targetSale) {
      return createResponse({
        message: "Invoice not found or not in completed status.",
        functionname,
      });
    }

    // Check if daily_purchase has is_dvat_30a as true - if yes, deny edit
    const dailyPurchase = await prisma.daily_purchase.findFirst({
      where: {
        invoice_number: targetSale.invoice_number,
        dvat04Id: targetSale.seller_tin_numberId,
        seller_tin_numberId: targetSale.seller_tin_numberId,
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    if (dailyPurchase && dailyPurchase.is_dvat_30a) {
      return createResponse({
        message: "Cannot edit invoice. This record is marked as DVAT 30A.",
        functionname,
      });
    }

    const parsedInvoiceDate = parse(
      payload.invoice_date,
      "dd/MM/yyyy",
      new Date(),
    );
    if (!isValid(parsedInvoiceDate)) {
      return createResponse({
        message: "Invoice date must be in dd/MM/yyyy format.",
        functionname,
      });
    }

    if (!payload.invoice_number.trim()) {
      return createResponse({
        message: "Invoice number is required.",
        functionname,
      });
    }

    const cstPurchaseValue = Number.parseFloat(payload.cst_purchase);
    if (!Number.isFinite(cstPurchaseValue) || cstPurchaseValue <= 0) {
      return createResponse({
        message: "CST Purchase value must be greater than 0.",
        functionname,
      });
    }

    // Get all refinery_sale records with same invoice details to update together
    const relatedSales = await prisma.refinery_sale.findMany({
      where: {
        refineryId: refinery.id,
        invoice_number: targetSale.invoice_number,
        invoice_date: targetSale.invoice_date,
        seller_tin_numberId: targetSale.seller_tin_numberId,
        refinery_status: "COMPLETED",
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    if (relatedSales.length === 0) {
      return createResponse({
        message: "Related invoice records not found.",
        functionname,
      });
    }

    // Calculate total quantity from all related sales
    const totalQuantity = relatedSales.reduce(
      (sum, sale) => sum + Number(sale.quantity || 0),
      0,
    );

    if (totalQuantity <= 0) {
      return createResponse({
        message: "Total quantity must be greater than 0.",
        functionname,
      });
    }

    // Update all related records in transaction
    await prisma.$transaction(async (tx) => {
      const taxRate = 2; // CST tax rate in percentage
      let remainingCst = cstPurchaseValue;

      for (let index = 0; index < relatedSales.length; index += 1) {
        const sale = relatedSales[index];

        // Update refinery_sale
        await tx.refinery_sale.update({
          where: {
            id: sale.id,
          },
          data: {
            invoice_number: payload.invoice_number,
            invoice_date: parsedInvoiceDate,
            cst_purchase: payload.cst_purchase,
            updatedById: currentUserId,
            updatedAt: new Date(),
          },
        });

        // Calculate proportional CST for this row
        const rowQuantity = Number(sale.quantity || 0);
        const rowShare = rowQuantity / totalQuantity;

        const rowCstTotal =
          index === relatedSales.length - 1
            ? remainingCst
            : Number((cstPurchaseValue * rowShare).toFixed(2));

        remainingCst = Number((remainingCst - rowCstTotal).toFixed(2));

        // Calculate amount, vatamount, and amount_unit
        const rowAmount = Number(
          (rowCstTotal / (1 + taxRate / 100)).toFixed(2),
        );
        const rowVatAmount = Number((rowCstTotal - rowAmount).toFixed(2));
        const rowAmountUnit = Number((rowCstTotal / rowQuantity).toFixed(2));

        // Update related daily_purchase if exists
        const relatedDailyPurchase = await tx.daily_purchase.findFirst({
          where: {
            invoice_number: targetSale.invoice_number,
            dvat04Id: targetSale.seller_tin_numberId,
            seller_tin_numberId: targetSale.seller_tin_numberId,
            deletedAt: null,
            status: "ACTIVE",
          },
        });

        if (relatedDailyPurchase) {
          await tx.daily_purchase.update({
            where: {
              id: relatedDailyPurchase.id,
            },
            data: {
              invoice_number: payload.invoice_number,
              invoice_date: parsedInvoiceDate,
              amount: rowAmount.toFixed(2),
              vatamount: rowVatAmount.toFixed(2),
              amount_unit: rowAmountUnit.toFixed(2),
              updatedById: currentUserId,
              updatedAt: new Date(),
            },
          });
        }

        // Create change log entry
        await tx.refinery_sale_change_log.create({
          data: {
            refinery_sale_id: sale.id,
            old_refinery_id: refinery.id,
            new_refinery_id: refinery.id,
            old_stock: Number(sale.quantity || 0),
            new_stock: Number(sale.quantity || 0),
            old_stock_after: Number(sale.quantity || 0),
            new_stock_after: Number(sale.quantity || 0),
            commodity_master_id: sale.commodity_masterId,
            seller_tin_number_id: sale.seller_tin_numberId,
            invoice_number: sale.invoice_number,
            invoice_date: sale.invoice_date,
            quantity: Number(sale.quantity || 0),
            amount_unit: sale.amount_unit,
            refinery_status_before: "COMPLETED",
            refinery_status_after: "COMPLETED",
            change_source: "EDIT_COMPLETED_INVOICE",
            createdById: currentUserId,
          },
        });
      }
    });

    return {
      status: true,
      data: null,
      message: "Invoice updated successfully.",
      functionname,
    };
  } catch (error) {
    console.error(`[${functionname}]`, error);
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default UpdateCompletedInvoice;
