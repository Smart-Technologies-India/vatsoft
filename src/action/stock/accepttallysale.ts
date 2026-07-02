"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import CreateMultiDailySale from "./createmultidailysale";

interface AcceptTallySalePayload {
  tallyIds: number[];
  dvatid: number;
  createdById: number;
}

const AcceptTallySale = async (
  payload: AcceptTallySalePayload,
): Promise<ApiResponseType<boolean>> => {
  const functionname: string = AcceptTallySale.name;
  const chunkSize = 100;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AcceptTallySale",
      } as any;
    }

    const records = await prisma.tally_sale.findMany({
      where: {
        id: { in: payload.tallyIds },
        status: "ACTIVE",
        is_converted: false,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
    });

    if (!records || records.length === 0) {
      return createResponse({
        message: "No valid tally sale records found to accept.",
        functionname,
      });
    }

    const requiredByCommodity = new Map<number, number>();
    for (const record of records) {
      requiredByCommodity.set(
        record.commodity_masterId,
        (requiredByCommodity.get(record.commodity_masterId) ?? 0) +
          record.quantity,
      );
    }

    const commodityIds = Array.from(requiredByCommodity.keys());
    const stockRows = await prisma.stock.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: payload.dvatid,
        commodity_masterId: { in: commodityIds },
      },
    });

    const availableByCommodity = new Map<number, number>();
    for (const row of stockRows) {
      availableByCommodity.set(
        row.commodity_masterId,
        (availableByCommodity.get(row.commodity_masterId) ?? 0) + row.quantity,
      );
    }

    for (const record of records) {
      const required = requiredByCommodity.get(record.commodity_masterId) ?? 0;
      const available = availableByCommodity.get(record.commodity_masterId) ?? 0;

      if (required > available) {
        return createResponse({
          message: `Insufficient stock for "${record.commodity_master.product_name}". Available: ${available}, Required: ${required}.`,
          functionname,
        });
      }
    }

    const totalRecords = records.length;
    const totalChunks = Math.ceil(totalRecords / chunkSize);

    for (let start = 0; start < totalRecords; start += chunkSize) {
      const chunkRecords = records.slice(start, start + chunkSize);

      const entries = chunkRecords.map((record) => {
        const taxPercent = record.tax_percent;
        const totalInvoice =
          parseFloat(record.amount) + parseFloat(record.vatamount);
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
          is_against_fform: false,
          is_export: false,
          batch_name: record.batch_name,
        };
      });

      const createResponseData = await CreateMultiDailySale({ entries });

      if (!createResponseData.status) {
        return createResponse({
          message: createResponseData.message,
          functionname,
        });
      }

      await prisma.tally_sale.updateMany({
        where: {
          id: { in: chunkRecords.map((record) => record.id) },
          status: "ACTIVE",
          is_converted: false,
        },
        data: { is_converted: true },
      });
    }

    return createResponse({
      message: `Tally sale records accepted and converted successfully. Processed ${totalRecords} row(s) in ${totalChunks} batch(es) of ${chunkSize}.`,
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

export default AcceptTallySale;
