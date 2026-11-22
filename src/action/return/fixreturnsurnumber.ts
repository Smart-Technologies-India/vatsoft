"use server";
import { getCurrentUserId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";

interface FixReturnsUrnNumberPayload {
  batchSize?: number;
}

interface BatchResult {
  batchNumber: number;
  processed: number;
  updated: number;
  error?: string;
}

const FixReturnsUrnNumber = async (
  payload: FixReturnsUrnNumberPayload,
): Promise<
  ApiResponseType<{
    totalProcessed: number;
    totalUpdated: number;
    batches: BatchResult[];
    failedBatches?: BatchResult[];
  } | null>
> => {
  const functionname: string = FixReturnsUrnNumber.name;

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

    const batchSize = payload.batchSize || 100;
    let totalProcessed = 0;
    let totalUpdated = 0;
    const batches: BatchResult[] = [];
    const failedBatches: BatchResult[] = [];

    // Get all matching records where urn_number doesn't match
    const matchingRecords = await prisma.$queryRaw<
      { id: number; urn_number: string; daily_sale_urn: string }[]
    >`
      SELECT 
        re.id,
        re.urn_number,
        ds.urn_number as daily_sale_urn
      FROM returns_entry re
      INNER JOIN returns_01 r ON r.id = re.returns_01Id
      INNER JOIN daily_sale ds ON 
        ds.dvat04Id = r.dvat04Id
        AND ds.invoice_number = re.invoice_number
        AND ds.seller_tin_numberId = re.seller_tin_numberId
        AND ds.quantity = re.quantity
        AND ds.commodity_masterId = re.commodity_masterId
      WHERE ds.urn_number != re.urn_number
      AND ds.invoice_date < "2026-08-01"
      AND re.urn_number != ''
      ORDER BY re.id ASC
    `;

    const totalCount = matchingRecords.length;

    if (totalCount === 0) {
      return {
        status: true,
        data: {
          totalProcessed: 0,
          totalUpdated: 0,
          batches: [],
        },
        message: "No records to update. All URN numbers are already synchronized.",
        functionname,
      } as any;
    }

    // Process in batches using Prisma updateMany for better performance
    let batchNumber = 0;

    for (let i = 0; i < matchingRecords.length; i += batchSize) {
      batchNumber++;
      const batchRecords = matchingRecords.slice(i, i + batchSize);

      try {
        // Use updateMany with individual updates to handle different urn_numbers per record
        let batchUpdatedCount = 0;

        for (const record of batchRecords) {
          await prisma.returns_entry.update({
            where: { id: record.id },
            data: { urn_number: record.daily_sale_urn },
          });
          batchUpdatedCount++;
        }

        totalProcessed += batchRecords.length;
        totalUpdated += batchUpdatedCount;

        batches.push({
          batchNumber,
          processed: batchRecords.length,
          updated: batchUpdatedCount,
        });
      } catch (batchError) {
        const errorMsg = errorToString(batchError);
        failedBatches.push({
          batchNumber,
          processed: batchRecords.length,
          updated: 0,
          error: errorMsg,
        });
      }
    }

    return {
      status: true,
      data: {
        totalProcessed,
        totalUpdated,
        batches,
        failedBatches: failedBatches.length > 0 ? failedBatches : undefined,
      },
      message: `Fixed ${totalUpdated} out of ${totalProcessed} records in ${batchNumber} batches`,
      functionname,
    } as any;
  } catch (error: any) {
    return {
      status: false,
      data: null,
      message: "Error: " + errorToString(error),
      functionname,
    } as any;
  }
};

export default FixReturnsUrnNumber;
