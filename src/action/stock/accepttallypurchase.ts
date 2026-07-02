"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import CreateMultiDailyPurchase from "./createmultidailypurchase";

interface AcceptTallyPurchasePayload {
  tallyIds: number[];
  dvatid: number;
  createdById: number;
}

const AcceptTallyPurchase = async (
  payload: AcceptTallyPurchasePayload,
): Promise<ApiResponseType<boolean>> => {
  const functionname: string = AcceptTallyPurchase.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AcceptTallyPurchase",
      } as any;
    }

    const records = await prisma.tally_purchase.findMany({
      where: {
        id: { in: payload.tallyIds },
        status: "ACTIVE",
        is_accept: false,
      },
    });

    if (!records || records.length === 0) {
      return createResponse({
        message: "No valid tally purchase records found to accept.",
        functionname,
      });
    }

    const entries = records.map((record) => {
      const taxPercent = record.tax_percent;
      const totalInvoice = parseFloat(record.amount) + parseFloat(record.vatamount);
      const taxableValue = totalInvoice / (1 + parseFloat(taxPercent) / 100);
      const vatValue = totalInvoice - taxableValue;

      const invoiceDate = new Date(
        new Date(record.invoice_date).toISOString().split("T")[0],
      );
      // invoiceDate.setDate(invoiceDate.getDate() + 1);

      return {
        dvatid: payload.dvatid,
        commodityid: record.commodity_masterId,
        quantity: record.quantity,
        seller_tin_id: record.seller_tin_numberId,
        invoice_number: record.invoice_number,
        invoice_date: invoiceDate,
        tax_percent: taxPercent,
        amount: taxableValue.toFixed(2),
        vatamount: vatValue.toFixed(2),
        amount_unit: record.amount_unit,
        createdById: payload.createdById,
        against_cfrom: record.is_against_cform,
        batch_name: record.batch_name,
      };
    });

    const createResponseData = await CreateMultiDailyPurchase({ entries });

    if (!createResponseData.status) {
      return createResponse({
        message: createResponseData.message,
        functionname,
      });
    }

    await prisma.tally_purchase.updateMany({
      where: { id: { in: records.map((record) => record.id) } },
      data: { is_accept: true },
    });

    return createResponse({
      message: "Tally purchase records accepted and converted to daily purchase successfully.",
      functionname,
      data: true,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AcceptTallyPurchase;
