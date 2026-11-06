"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface BulkDeleteSalePayload {
  ids: number[];
  batchSize?: number;
}

interface BulkDeleteResult {
  successCount: number;
  failedCount: number;
  failedIds: number[];
  errors: string[];
}

const BulkDeleteSale = async (
  payload: BulkDeleteSalePayload,
): Promise<ApiResponseType<BulkDeleteResult>> => {
  const functionname: string = BulkDeleteSale.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const { ids, batchSize = 50 } = payload;

    if (!ids || ids.length === 0) {
      return createResponse({
        message: "No sale records provided for deletion.",
        functionname,
        data: {
          successCount: 0,
          failedCount: 0,
          failedIds: [],
          errors: [],
        },
      });
    }

    const result: BulkDeleteResult = {
      successCount: 0,
      failedCount: 0,
      failedIds: [],
      errors: [],
    };

    // Process in batches to avoid memory issues
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);

      try {
        // Single transaction for entire batch
        const batchResultCount = await prisma.$transaction(async (tx) => {
          // Step 1: Fetch all sale entries in this batch
          const salesToDelete = await tx.daily_sale.findMany({
            where: {
              id: { in: batch },
              deletedAt: null,
              deletedById: null,
            },
            select: {
              id: true,
              dvat04Id: true,
              commodity_masterId: true,
              quantity: true,
              invoice_number: true,
              invoice_date: true,
              urn_number: true,
              seller_tin_numberId: true,
            },
          });

          // Step 2: Get unique DVATs and TINs for this batch (reduce queries)
          const uniqueDvatIds = [...new Set(salesToDelete.map((s) => s.dvat04Id))];
          const uniqueTinIds = [...new Set(salesToDelete.map((s) => s.seller_tin_numberId))];

          const dvatMap = await tx.dvat04.findMany({
            where: {
              id: { in: uniqueDvatIds },
              deletedAt: null,
              deletedById: null,
            },
            select: { id: true, tinNumber: true },
          });

          const tinMap = await tx.tin_number_master.findMany({
            where: {
              id: { in: uniqueTinIds },
              deletedAt: null,
            },
            select: { id: true, tin_number: true },
          });

          const dvatById = Object.fromEntries(dvatMap.map((d) => [d.id, d.tinNumber]));
          const tinById = Object.fromEntries(tinMap.map((t) => [t.id, t.tin_number]));

          // Step 3: Update stocks in batch
          const stockUpdates = salesToDelete.map((sale) => ({
            dvat04Id: sale.dvat04Id,
            commodity_masterId: sale.commodity_masterId,
            quantity: sale.quantity,
          }));

          for (const { dvat04Id, commodity_masterId, quantity } of stockUpdates) {
            await tx.stock.updateMany(
              {
                where: {
                  dvat04Id,
                  commodity_masterId,
                  deletedAt: null,
                  deletedById: null,
                },
                data: {
                  quantity: {
                    increment: quantity,
                  },
                },
              },
            );
          }

          // Step 4: Collect all purchase updates for batch
          const purchaseUpdatesToExecute: Array<{
            buyerDvatId: number;
            sellerTinId: number;
            invoiceNumber: string;
            invoiceDate: Date;
          }> = [];

          for (const sale of salesToDelete) {
            const sellerTinNumber = dvatById[sale.dvat04Id];
            const buyerTinNumber = tinById[sale.seller_tin_numberId];

            if (sellerTinNumber && buyerTinNumber) {
              // Get buyer DVAT by TIN
              const buyerDvat = await tx.dvat04.findFirst({
                where: {
                  tinNumber: buyerTinNumber,
                  deletedAt: null,
                  deletedById: null,
                },
                select: { id: true },
              });

              if (buyerDvat) {
                // Get seller TIN master
                const sellerTinMaster = await tx.tin_number_master.findFirst({
                  where: {
                    tin_number: sellerTinNumber,
                    status: "ACTIVE",
                    deletedAt: null,
                  },
                  select: { id: true },
                });

                if (sellerTinMaster) {
                  purchaseUpdatesToExecute.push({
                    buyerDvatId: buyerDvat.id,
                    sellerTinId: sellerTinMaster.id,
                    invoiceNumber: sale.invoice_number,
                    invoiceDate: sale.invoice_date,
                  });
                }
              }
            }
          }

          // Step 5: Execute all purchase updates for batch
          for (const update of purchaseUpdatesToExecute) {
            await tx.daily_purchase.updateMany({
              where: {
                dvat04Id: update.buyerDvatId,
                seller_tin_numberId: update.sellerTinId,
                invoice_number: update.invoiceNumber,
                invoice_date: update.invoiceDate,
                deletedAt: null,
                status: "ACTIVE",
              },
              data: {
                status: "INACTIVE",
                updatedById: currentUserId,
                deletedAt: new Date(),
                deletedById: currentUserId,
              },
            });
          }

          // Step 6: Create audit entries for batch
          // Step 6: Soft delete all sales in batch (skip audit entry creation for bulk delete)
          await tx.daily_sale.updateMany({
            where: {
              id: { in: salesToDelete.map((s) => s.id) },
            },
            data: {
              updatedById: currentUserId,
              deletedById: currentUserId,
              deletedAt: new Date(),
              status: "INACTIVE",
            },
          });

          // Step 7: Update returns_entry for batch (all URNs at once)
          const urnNumbers = salesToDelete
            .filter((s) => s.urn_number)
            .map((s) => s.urn_number);

          if (urnNumbers.length > 0) {
            await tx.returns_entry.updateMany({
              where: {
                description_of_goods: { in: urnNumbers as string[] },
                deletedAt: null,
                status: "ACTIVE",
              },
              data: {
                updatedById: currentUserId,
                deletedById: currentUserId,
                deletedAt: new Date(),
                status: "INACTIVE",
              },
            });
          }

          return salesToDelete.length;
        });

        result.successCount += batchResultCount;
      } catch (batchError) {
        const errorMsg = errorToString(batchError);
        result.errors.push(`Batch [${i}-${i + batchSize}]: ${errorMsg}`);
        result.failedCount += batch.length;
        result.failedIds.push(...batch);
      }
    }

    return createResponse({
      message: `Bulk delete completed. Success: ${result.successCount}, Failed: ${result.failedCount}`,
      functionname,
      data: result,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default BulkDeleteSale;
