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
  chunkIndex?: number;
  chunkSize?: number;
}

const AcceptTallyPurchase = async (
  payload: AcceptTallyPurchasePayload,
): Promise<
  ApiResponseType<{
    processed: number;
    total: number;
    totalChunks: number;
    currentChunk: number;
  }>
> => {
  const functionname: string = AcceptTallyPurchase.name;
  const chunkSize = payload.chunkSize || 100;
  const chunkIndex = payload.chunkIndex ?? -1; // -1 means process all chunks

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

    const totalRecords = records.length;
    const totalChunks = Math.ceil(totalRecords / chunkSize);

    // If specific chunk is requested, process only that chunk
    if (chunkIndex >= 0) {
      const start = chunkIndex * chunkSize;
      const end = start + chunkSize;

      if (start >= totalRecords) {
        return {
          status: true,
          data: {
            processed: 0,
            total: totalRecords,
            totalChunks,
            currentChunk: chunkIndex,
          },
          message: "Chunk index out of range - all records already processed.",
          functionname,
        } as any;
      }

      const chunkRecords = records.slice(start, end);
      const entries = chunkRecords.map((record) => {
        const taxPercent = record.tax_percent;
        const totalInvoice =
          parseFloat(record.amount) + parseFloat(record.vatamount);
        const taxableValue = totalInvoice / (1 + parseFloat(taxPercent) / 100);
        const vatValue = totalInvoice - taxableValue;

        const invoiceDate = new Date(
          new Date(record.invoice_date).toISOString().split("T")[0],
        );

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
        return {
          status: false,
          data: {
            processed: 0,
            total: totalRecords,
            totalChunks,
            currentChunk: chunkIndex,
          },
          message: createResponseData.message,
          functionname,
        } as any;
      }

      await prisma.tally_purchase.deleteMany({
        where: { id: { in: chunkRecords.map((record) => record.id) } },
      });

      return {
        status: true,
        data: {
          processed: chunkRecords.length,
          total: totalRecords,
          totalChunks,
          currentChunk: chunkIndex,
        },
        message: `Chunk ${chunkIndex + 1} of ${totalChunks} processed (${chunkRecords.length} records).`,
        functionname,
      } as any;
    }

    // Process all chunks (original behavior for backward compatibility)
    let totalProcessed = 0;

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
        return {
          status: false,
          data: {
            processed: totalProcessed,
            total: totalRecords,
            totalChunks,
            currentChunk: Math.ceil(totalProcessed / chunkSize),
          },
          message: createResponseData.message,
          functionname,
        } as any;
      }

      await prisma.tally_purchase.deleteMany({
        where: { id: { in: chunkRecords.map((record) => record.id) } },
      });

      totalProcessed += chunkRecords.length;
    }

    return {
      status: true,
      data: {
        processed: totalProcessed,
        total: totalRecords,
        totalChunks,
        currentChunk: totalChunks,
      },
      message: `Tally purchase records accepted and converted to daily purchase successfully. Processed ${totalRecords} row(s) in ${totalChunks} batch(es) of ${chunkSize}.`,
      functionname,
    } as any;
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AcceptTallyPurchase;
