"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

interface BulkDailyPurchaseEntry {
  dvatid: number;
  commodityid: number;
  quantity: number;
  seller_tin_id: number;
  invoice_number: string;
  invoice_date: Date;
  tax_percent: string;
  amount: string;
  vatamount: string;
  amount_unit: string;
  createdById: number;
  against_cfrom: boolean;
  is_against_fform?: boolean;
  is_against_hform?: boolean;
  is_against_iform?: boolean;
  is_against_e1form?: boolean;
  is_export?: boolean;
  is_accept?: boolean;
  batch_name: string | null;
}

interface BulkDailyPurchasePayload {
  entries: BulkDailyPurchaseEntry[];
}

const BulkDailyPurchase = async (
  payload: BulkDailyPurchasePayload,
): Promise<
  ApiResponseType<{
    createdCount: number;
    failedCount: number;
    failedEntries?: Array<{
      invoice_number: string;
      error: string;
      commodity_id?: number;
      commodity_name?: string;
      invoice_date?: Date | string;
      quantity?: number;
    }>;
  } | null>
> => {
  const functionname: string = BulkDailyPurchase.name;

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

    const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwyz", 12);

    let createdCount = 0;
    let failedCount = 0;
    const failedEntries: Array<{
      invoice_number: string;
      error: string;
      commodity_id?: number;
      commodity_name?: string;
      invoice_date?: Date | string;
      quantity?: number;
    }> = [];

    // Process all entries in a single transaction
    const result = await prisma.$transaction(
      async (tx) => {
        for (const entry of payload.entries) {
          let commodityName: string | undefined;
          try {
            const ref_no: string = nanoid();

            // Get commodity name
            const commodity = await tx.commodity_master.findFirst({
              where: {
                id: entry.commodityid,
                deletedAt: null,
                deletedById: null,
              },
              select: { product_name: true },
            });

            commodityName = commodity?.product_name;

            // Check for duplicate entry
            const existingEntry = await tx.daily_purchase.findFirst({
              where: {
                dvat04Id: currentDvatId,
                deletedAt: null,
                deletedById: null,
                status: "ACTIVE",
                invoice_number: entry.invoice_number,
                quantity: entry.quantity,
                invoice_date: entry.invoice_date,
                commodity_masterId: entry.commodityid,
                ...(entry.batch_name !== null && { batch_name: entry.batch_name }),
              },
            });

            if (existingEntry) {
              failedEntries.push({
                invoice_number: entry.invoice_number,
                error: "Duplicate entry detected.",
                commodity_id: entry.commodityid,
                commodity_name: commodityName,
                invoice_date: entry.invoice_date,
                quantity: entry.quantity,
              });
              failedCount++;
              continue;
            }

            // Check if seller TIN exists
            const seller_tin_number = await tx.tin_number_master.findFirst({
              where: {
                id: entry.seller_tin_id,
                deletedAt: null,
              },
            });

            if (!seller_tin_number) {
              failedEntries.push({
                invoice_number: entry.invoice_number,
                error: "Seller TIN number not found.",
                commodity_id: entry.commodityid,
                commodity_name: commodityName,
                invoice_date: entry.invoice_date,
                quantity: entry.quantity,
              });
              failedCount++;
              continue;
            }

            // Create daily purchase record
            const purchaseRecord = await tx.daily_purchase.create({
              data: {
                dvat04Id: currentDvatId,
                seller_tin_numberId: entry.seller_tin_id,
                invoice_number: entry.invoice_number,
                invoice_date: entry.invoice_date,
                commodity_masterId: entry.commodityid,
                quantity: entry.quantity,
                tax_percent: entry.tax_percent,
                amount: entry.amount,
                amount_unit: entry.amount_unit,
                vatamount: entry.vatamount,
                is_dvat_30a: false,
                createdById: currentUserId,
                is_local:
                  seller_tin_number.tin_number.startsWith("25") ||
                  seller_tin_number.tin_number.startsWith("26"),
                is_against_cform: entry.against_cfrom,
                is_against_fform: entry.is_against_fform ?? false,
                is_against_hform: entry.is_against_hform ?? false,
                is_against_iform: entry.is_against_iform ?? false,
                is_against_e1form: entry.is_against_e1form ?? false,
                is_export: entry.is_export ?? false,
                is_accept: entry.is_accept ?? false,
                urn_number: ref_no,
              },
            });

            if (!purchaseRecord) {
              failedEntries.push({
                invoice_number: entry.invoice_number,
                error: "Unable to create daily purchase record.",
                commodity_id: entry.commodityid,
                commodity_name: commodityName,
                invoice_date: entry.invoice_date,
                quantity: entry.quantity,
              });
              failedCount++;
              continue;
            }

            // Update or create stock record
            const existingStock = await tx.stock.findFirst({
              where: {
                deletedAt: null,
                deletedById: null,
                status: "ACTIVE",
                dvat04Id: currentDvatId,
                commodity_masterId: entry.commodityid,
              },
            });

            if (existingStock) {
              // Update existing stock
              await tx.stock.update({
                where: {
                  id: existingStock.id,
                  deletedAt: null,
                  deletedById: null,
                },
                data: {
                  quantity: entry.quantity + existingStock.quantity,
                  updatedById: currentUserId,
                },
              });
            } else {
              // Create new stock record
              await tx.stock.create({
                data: {
                  dvat04Id: currentDvatId,
                  commodity_masterId: entry.commodityid,
                  quantity: entry.quantity,
                  createdById: currentUserId,
                  status: "ACTIVE",
                },
              });
            }

            createdCount++;
          } catch (entryError) {
            failedEntries.push({
              invoice_number: entry.invoice_number,
              error: errorToString(entryError),
              commodity_id: entry.commodityid,
              commodity_name: commodityName,
              invoice_date: entry.invoice_date,
              quantity: entry.quantity,
            });
            failedCount++;
          }
        }

        return { createdCount, failedCount, failedEntries };
      },
      {
        maxWait: 5000, // 5 second timeout
        timeout: 300000, // 5 minute timeout
      },
    );

    return createResponse({
      message: `${result.createdCount} entr${result.createdCount === 1 ? "y" : "ies"} created successfully${result.failedCount > 0 ? `, ${result.failedCount} failed` : ""}.`,
      functionname,
      data: {
        createdCount: result.createdCount,
        failedCount: result.failedCount,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default BulkDailyPurchase;
