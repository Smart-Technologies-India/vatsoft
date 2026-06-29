"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";
import { parse, isValid } from "date-fns";
import CreateDailyPurchase from "../stock/createdailypuchase";

export interface DispatchPayload {
  id: number; // any row id of the invoice
  invoice_number: string;
  invoice_date: string; // dd/MM/yyyy
  vehicle_number: string;
  kilo_liter?: string;
  line_items?: Array<{
    sale_id: number;
    kilo_liter: string;
  }>;
  cstpurchase: string;
}

const DispatchRefinerySale = async (
  payload: DispatchPayload,
): Promise<ApiResponseType<null>> => {
  const functionname = DispatchRefinerySale.name;

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

    const refinery = await prisma.refinery.findFirst({
      where: { deletedAt: null, createdById: currentUserId },
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
      },
    });

    if (!targetSale) {
      return createResponse({
        message: "Invoice not found.",
        functionname,
      });
    }

    const vatPaidRows = await prisma.refinery_sale.findMany({
      where: {
        refineryId: refinery.id,
        invoice_number: targetSale.invoice_number,
        invoice_date: targetSale.invoice_date,
        seller_tin_numberId: targetSale.seller_tin_numberId,
        refinery_status: "VATPAID",
        deletedAt: null,
        status: "ACTIVE",
      },
      orderBy: {
        id: "asc",
      },
    });

    if (vatPaidRows.length === 0) {
      return createResponse({
        message: "Invoice not found or already dispatched.",
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

    const dispatchRows = vatPaidRows.map((row) => ({
      saleId: row.id,
      commodityMasterId: row.commodity_masterId,
      quantity: Number(row.quantity || 0),
    }));

    if (payload.line_items && payload.line_items.length > 0) {
      const requestedById = new Map<number, number>();

      for (const item of payload.line_items) {
        const parsedKiloLiter = Number.parseFloat(item.kilo_liter);
        if (!Number.isFinite(parsedKiloLiter) || parsedKiloLiter <= 0) {
          return createResponse({
            message: "Kilo liter must be greater than 0 for each item.",
            functionname,
          });
        }

        if (requestedById.has(item.sale_id)) {
          return createResponse({
            message: "Duplicate item quantity input found.",
            functionname,
          });
        }

        requestedById.set(item.sale_id, Math.round(parsedKiloLiter * 1000));
      }

      if (requestedById.size !== vatPaidRows.length) {
        return createResponse({
          message: "Please provide Kilo Liter for all items.",
          functionname,
        });
      }

      for (const row of dispatchRows) {
        const quantity = requestedById.get(row.saleId);
        if (!quantity || quantity <= 0) {
          return createResponse({
            message: "Missing valid Kilo Liter for one or more items.",
            functionname,
          });
        }

        row.quantity = quantity;
      }
    } else {
      const parsedKiloLiter = Number.parseFloat(payload.kilo_liter || "");
      if (!Number.isFinite(parsedKiloLiter) || parsedKiloLiter <= 0) {
        return createResponse({
          message: "Kilo liter must be greater than 0.",
          functionname,
        });
      }

      const parsedLiter = parsedKiloLiter * 1000;
      const dispatchQuantity = Math.round(parsedLiter);
      const totalVatPaidQuantity = dispatchRows.reduce(
        (sum, row) => sum + Number(row.quantity || 0),
        0,
      );

      if (dispatchQuantity !== totalVatPaidQuantity) {
        return createResponse({
          message: `Kilo liter must match invoice total quantity (${(totalVatPaidQuantity / 1000).toFixed(3)} kL).`,
          functionname,
        });
      }
    }

    const totalDispatchQuantity = dispatchRows.reduce(
      (sum, row) => sum + Number(row.quantity || 0),
      0,
    );

    if (totalDispatchQuantity <= 0) {
      return createResponse({
        message: "Total dispatch quantity must be greater than 0.",
        functionname,
      });
    }

    const cstPurchaseValue = Number.parseFloat(payload.cstpurchase);
    if (!Number.isFinite(cstPurchaseValue) || cstPurchaseValue <= 0) {
      return createResponse({
        message: "CST Purchase value must be greater than 0.",
        functionname,
      });
    }

    const quantityBySaleId = new Map(
      dispatchRows.map((row) => [row.saleId, row.quantity]),
    );

    await prisma.$transaction(
      vatPaidRows.map((row) =>
        prisma.refinery_sale.update({
          where: {
            id: row.id,
          },
          data: {
            refinery_status: "COMPLETED",
            invoice_number: payload.invoice_number,
            invoice_date: parsedInvoiceDate,
            vehicle_number: payload.vehicle_number,
            updatedById: currentUserId,
            updatedAt: new Date(),
            quantity: quantityBySaleId.get(row.id) || row.quantity,
          },
        }),
      ),
    );

    const taxRate = 2; // CST tax rate in percentage

    let remainingCst = cstPurchaseValue;
    for (let index = 0; index < dispatchRows.length; index += 1) {
      const row = dispatchRows[index];
      const rowQuantity = Number(row.quantity || 0);
      const rowShare = rowQuantity / totalDispatchQuantity;

      const rowCstTotal =
        index === vatPaidRows.length - 1
          ? remainingCst
          : Number((cstPurchaseValue * rowShare).toFixed(2));

      remainingCst = Number((remainingCst - rowCstTotal).toFixed(2));

      const rowAmount = Number((rowCstTotal / (1 + taxRate / 100)).toFixed(2));
      const rowVatAmount = Number((rowCstTotal - rowAmount).toFixed(2));
      const rowAmountUnit = Number((rowCstTotal / rowQuantity).toFixed(2));

      const stockResponse = await CreateDailyPurchase({
        amount_unit: rowAmountUnit.toFixed(2),
        invoice_date: parsedInvoiceDate,
        invoice_number: payload.invoice_number,
        dvatid: targetSale.seller_tin_numberId,
        quantity: rowQuantity,
        vatamount: rowVatAmount.toFixed(2),
        commodityid: row.commodityMasterId,
        tax_percent: "2",
        seller_tin_id: refinery.tin_master_id,
        amount: rowAmount.toFixed(2),
        against_cfrom: true,
        is_against_fform: false,
        is_against_hform: false,
        is_against_iform: false,
        is_against_e1form: false,
        is_export: false,
      });

      if (!stockResponse.status) {
        return createResponse({
          functionname,
          message: `Failed to create daily purchase record: ${stockResponse.message}`,
        });
      }
    }

    return {
      status: true,
      data: null,
      message: "Sale Completed successfully.",
      functionname,
    };
  } catch (error) {
    return {
      status: false,
      data: null,
      message: errorToString(error),
      functionname,
    };
  }
};

export default DispatchRefinerySale;
