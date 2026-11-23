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
    // Using Prisma findMany with include to get related data
    const returnsEntries = await prisma.returns_entry.findMany({
      where: {
        urn_number: {
          not: "",
        },
      },
      include: {
        returns_01: true,
      },
      take: 10000,
    });

    if (!returnsEntries || returnsEntries.length === 0) {
      return {
        status: true,
        data: {
          totalProcessed: 0,
          totalUpdated: 0,
          batches: [],
        },
        message: "No returns entries found.",
        functionname,
      } as any;
    }

    // For each returns_entry, find matching daily_sale and check if urn_number differs
    const matchingRecords: Array<{
      id: number;
      urn_number: string;
      daily_sale_urn: string;
    }> = [];

    for (const entry of returnsEntries) {
      if (!entry.returns_01Id) continue;

      try {
        const whereCondition: any = {
          dvat04Id: entry.returns_01.dvat04Id,
          invoice_number: entry.invoice_number,
          seller_tin_numberId: entry.seller_tin_numberId,
        };

        // Only add quantity and commodity_masterId if they're not null
        if (entry.quantity !== null) {
          whereCondition.quantity = entry.quantity;
        }
        if (entry.commodity_masterId !== null) {
          whereCondition.commodity_masterId = entry.commodity_masterId;
        }

        const dailySale = await prisma.daily_sale.findFirst({
          where: whereCondition,
          select: {
            id: true,
            urn_number: true,
          },
        });

        if (
          dailySale &&
          dailySale.urn_number &&
          dailySale.urn_number !== entry.urn_number
        ) {
          matchingRecords.push({
            id: entry.id,
            urn_number: entry.urn_number || "",
            daily_sale_urn: dailySale.urn_number,
          });
        }
      } catch (err) {
        // Continue to next record if search fails
        continue;
      }
    }

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

    // Process in batches using Prisma updates
    let batchNumber = 0;

    for (let i = 0; i < matchingRecords.length; i += batchSize) {
      batchNumber++;
      const batchRecords = matchingRecords.slice(i, i + batchSize);

      try {
        let batchUpdatedCount = 0;

        // Update each record using Prisma update
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
    console.error("FixReturnsUrnNumber Error:", error);
    return {
      status: false,
      data: null,
      message: "Error: " + errorToString(error),
      functionname,
    } as any;
  }
};

export default FixReturnsUrnNumber;
