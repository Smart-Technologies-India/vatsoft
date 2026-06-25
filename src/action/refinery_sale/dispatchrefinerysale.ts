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
  kilo_liter: string;
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
        refinery_status: "VATPAID",
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    if (!targetSale) {
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

    const parsedKiloLiter = Number.parseFloat(payload.kilo_liter);
    if (!Number.isFinite(parsedKiloLiter) || parsedKiloLiter <= 0) {
      return createResponse({
        message: "Kilo liter must be greater than 0.",
        functionname,
      });
    }

    const parsedLiter = parsedKiloLiter * 1000;

    const dispatchQuantity = Math.round(parsedLiter);

    await prisma.refinery_sale.updateMany({
      where: {
        refineryId: refinery.id,
        invoice_number: targetSale.invoice_number,
        seller_tin_numberId: targetSale.seller_tin_numberId,
        refinery_status: "VATPAID",
        deletedAt: null,
        status: "ACTIVE",
      },
      data: {
        refinery_status: "COMPLETED",
        invoice_number: payload.invoice_number,
        invoice_date: parsedInvoiceDate,
        vehicle_number: payload.vehicle_number,
        // Shipment_time: new Date(),
        updatedById: currentUserId,
        updatedAt: new Date(),
        quantity: dispatchQuantity,
      },
    });

    const taxRate = 2; // CST tax rate in percentage

    const amount = (
      parseFloat(payload.cstpurchase) /
      (1 + taxRate / 100)
    ).toFixed(2);

    const vatAmount = (
      parseFloat(payload.cstpurchase) - parseFloat(amount)
    ).toFixed(2);

    const amount_unit = (
      parseFloat(payload.cstpurchase) / dispatchQuantity
    ).toFixed(2);

    const stock_response = await CreateDailyPurchase({
      amount_unit: amount_unit,
      invoice_date: parsedInvoiceDate,
      invoice_number: payload.invoice_number,
      dvatid: targetSale.seller_tin_numberId,
      quantity: dispatchQuantity,
      vatamount: vatAmount,
      commodityid: targetSale.commodity_masterId,
      tax_percent: "2",
      seller_tin_id: refinery.tin_master_id,
      amount: amount,
      against_cfrom: true,
      is_against_fform: false,
      is_against_hform: false,
      is_against_iform: false,
      is_against_e1form: false,
      is_export: false,
    });

    if (!stock_response.status) {
      return createResponse({
        functionname,
        message: `Failed to create daily purchase record: ${stock_response.message}`,
      });
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
