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
        const batchResultCount = await prisma.$transaction(
          async (tx) => {
            // Step 1: Fetch all sale entries with related data in one query
            const salesToDelete = await tx.daily_sale.findMany({
              where: {
                id: { in: batch },
                deletedAt: null,
                deletedById: null,
              },
              include: {
                dvat04: {
                  select: { id: true, tinNumber: true },
                },
                seller_tin_number: {
                  select: { id: true, tin_number: true },
                },
              },
            });

            if (salesToDelete.length === 0) {
              return 0;
            }

            // Step 2: Get all seller TIN numbers and buyer TIN numbers upfront
            const sellerTinNumbers = salesToDelete
              .map((s) => s.dvat04?.tinNumber)
              .filter(Boolean) as string[];
            const buyerTinNumbers = salesToDelete
              .map((s) => s.seller_tin_number?.tin_number)
              .filter(Boolean) as string[];

            // Fetch seller TIN masters and buyer DVATs in parallel
            const [sellerTinMasters, buyerDvats] = await Promise.all([
              tx.tin_number_master.findMany({
                where: {
                  tin_number: { in: sellerTinNumbers },
                  status: "ACTIVE",
                  deletedAt: null,
                },
                select: { id: true, tin_number: true },
              }),
              tx.dvat04.findMany({
                where: {
                  tinNumber: { in: buyerTinNumbers },
                  deletedAt: null,
                  deletedById: null,
                },
                select: { id: true, tinNumber: true },
              }),
            ]);

            const sellerTinById = Object.fromEntries(
              sellerTinMasters.map((t) => [t.tin_number, t.id]),
            );
            const buyerDvatByTin = Object.fromEntries(
              buyerDvats.map((d) => [d.tinNumber, d.id]),
            );

            // Step 3: Update stocks in batch (single updateMany call per unique stock)
            const stockUpdateMap = new Map<
              string,
              { dvat04Id: number; commodity_masterId: number; totalQuantity: number }
            >();

            for (const sale of salesToDelete) {
              const key = `${sale.dvat04Id}-${sale.commodity_masterId}`;
              const existing = stockUpdateMap.get(key);
              if (existing) {
                existing.totalQuantity += sale.quantity;
              } else {
                stockUpdateMap.set(key, {
                  dvat04Id: sale.dvat04Id,
                  commodity_masterId: sale.commodity_masterId,
                  totalQuantity: sale.quantity,
                });
              }
            }

            // Execute all stock updates in parallel
            await Promise.all(
              Array.from(stockUpdateMap.values()).map((update) =>
                tx.stock.updateMany({
                  where: {
                    dvat04Id: update.dvat04Id,
                    commodity_masterId: update.commodity_masterId,
                    deletedAt: null,
                    deletedById: null,
                  },
                  data: {
                    quantity: {
                      increment: update.totalQuantity,
                    },
                  },
                }),
              ),
            );

            // Step 4: Prepare purchase updates in batch
            const purchaseUpdateMap = new Map<
              string,
              { buyerDvatId: number; sellerTinId: number; entries: any[] }
            >();

            for (const sale of salesToDelete) {
              const sellerTinNumber = sale.dvat04?.tinNumber;
              const buyerTinNumber = sale.seller_tin_number?.tin_number;

              if (sellerTinNumber && buyerTinNumber) {
                const sellerTinId = sellerTinById[sellerTinNumber];
                const buyerDvatId = buyerDvatByTin[buyerTinNumber];

                if (sellerTinId && buyerDvatId) {
                  const key = `${buyerDvatId}-${sellerTinId}`;
                  const existing = purchaseUpdateMap.get(key);
                  if (existing) {
                    existing.entries.push({
                      invoiceNumber: sale.invoice_number,
                      invoiceDate: sale.invoice_date,
                    });
                  } else {
                    purchaseUpdateMap.set(key, {
                      buyerDvatId,
                      sellerTinId,
                      entries: [
                        {
                          invoiceNumber: sale.invoice_number,
                          invoiceDate: sale.invoice_date,
                        },
                      ],
                    });
                  }
                }
              }
            }

            // Step 5: Execute all purchase updates in batch
            await Promise.all(
              Array.from(purchaseUpdateMap.values()).map((update) =>
                tx.daily_purchase.updateMany({
                  where: {
                    dvat04Id: update.buyerDvatId,
                    seller_tin_numberId: update.sellerTinId,
                    OR: update.entries.map((e) => ({
                      invoice_number: e.invoiceNumber,
                      invoice_date: e.invoiceDate,
                    })),
                    deletedAt: null,
                    status: "ACTIVE",
                  },
                  data: {
                    status: "INACTIVE",
                    updatedById: currentUserId,
                    deletedAt: new Date(),
                    deletedById: currentUserId,
                  },
                }),
              ),
            );

            // Step 6: Soft delete all sales in batch
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
          },
          {
            timeout: 30000,
          },
        );

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
