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
  chunkIndex?: number;
  chunkSize?: number;
}

const AcceptTallySale = async (
  payload: AcceptTallySalePayload,
): Promise<
  ApiResponseType<{
    processed: number;
    total: number;
    totalChunks: number;
    currentChunk: number;
  }>
> => {
  const functionname: string = AcceptTallySale.name;
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
      include: {
        commodity_master: true,
      },
    });

    const availableByCommodity = new Map<number, number>();
    const packSizeByCommodity = new Map<number, number>();
    for (const row of stockRows) {
      const packSize = parseFloat(row.commodity_master?.pack_size || "1");
      packSizeByCommodity.set(row.commodity_masterId, packSize);
      availableByCommodity.set(
        row.commodity_masterId,
        (availableByCommodity.get(row.commodity_masterId) ?? 0) + row.quantity,
      );
    }

    for (const record of records) {
      const required = requiredByCommodity.get(record.commodity_masterId) ?? 0;
      const availablePcs =
        availableByCommodity.get(record.commodity_masterId) ?? 0;
      const packSize = packSizeByCommodity.get(record.commodity_masterId) ?? 1;
      const requiredPcs = Math.ceil(required / packSize);

      if (requiredPcs > availablePcs) {
        const availableQuantity = availablePcs * packSize;
        return createResponse({
          message: `Insufficient stock for "${record.commodity_master.product_name}". Available: ${availableQuantity}, Required: ${required}.`,
          functionname,
        });
      }
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
          is_against_fform: false,
          is_export: false,
          batch_name: record.batch_name,
        };
      });

      const createResponseData = await CreateMultiDailySale({ entries });

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

      await prisma.tally_sale.deleteMany({
        where: {
          id: { in: chunkRecords.map((record) => record.id) },
          status: "ACTIVE",
          is_converted: false,
        },
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
          is_against_fform: false,
          is_export: false,
          batch_name: record.batch_name,
        };
      });

      const createResponseData = await CreateMultiDailySale({ entries });

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

      await prisma.tally_sale.deleteMany({
        where: {
          id: { in: chunkRecords.map((record) => record.id) },
          status: "ACTIVE",
          is_converted: false,
        },
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
      message: `Tally sale records accepted and converted successfully. Processed ${totalRecords} row(s) in ${totalChunks} batch(es) of ${chunkSize}.`,
      functionname,
    } as any;
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AcceptTallySale;
