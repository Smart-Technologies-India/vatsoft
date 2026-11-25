"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

interface BulkDailySaleEntry {
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
  against_cfrom: boolean;
  is_against_fform: boolean;
  is_exempt?: boolean;
  is_against_iform?: boolean;
  is_h_export?: boolean;
  is_against_e1?: boolean;
  is_export: boolean;
  batch_name: string | null;
}

interface BulkDailySalePayload {
  entries: BulkDailySaleEntry[];
}

const BulkDailySale = async (
  payload: BulkDailySalePayload,
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
  const functionname: string = BulkDailySale.name;

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

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

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
            // Validate that entry DVAT ID matches current user's DVAT ID
            if (entry.dvatid !== currentDvatId) {
              failedEntries.push({
                invoice_number: entry.invoice_number,
                error: "Unauthorized: This DVAT ID does not belong to your account.",
                commodity_id: entry.commodityid,
                invoice_date: entry.invoice_date,
                quantity: entry.quantity,
              });
              failedCount++;
              continue;
            }

            const invoiceDate = new Date(entry.invoice_date);
            const april2026Start = new Date(2026, 3, 1);

            if (invoiceDate < april2026Start) {
              failedEntries.push({
                invoice_number: entry.invoice_number,
                error: "The return upto March 2026 has to be filed on old portal.",
                commodity_id: entry.commodityid,
                invoice_date: entry.invoice_date,
                quantity: entry.quantity,
              });
              failedCount++;
              continue;
            }

            const invoiceMonthName = monthNames[invoiceDate.getMonth()];
            const invoiceYear = invoiceDate.getFullYear().toString();

            // Check if return is filed
            const filedReturnFiling = await tx.return_filing.findFirst({
              where: {
                deletedAt: null,
                deletedById: null,
                dvatid: entry.dvatid,
                year: invoiceYear,
                month: invoiceMonthName,
                filing_status: true,
                OR: [{ return_status: "FILED" }, { return_status: "LATEFILED" }],
              },
            });

            const paidReturn = await tx.returns_01.findFirst({
              where: {
                deletedAt: null,
                deletedById: null,
                dvat04Id: entry.dvatid,
                year: invoiceYear,
                month: invoiceMonthName,
                OR: [{ return_type: "REVISED" }, { return_type: "ORIGINAL" }],
                rr_number: {
                  not: "",
                },
              },
            });

            if (filedReturnFiling || paidReturn) {
              failedEntries.push({
                invoice_number: entry.invoice_number,
                error: `The return for ${invoiceMonthName} is already filed. Kindly file revise return.`,
                commodity_id: entry.commodityid,
                commodity_name: commodityName,
                invoice_date: entry.invoice_date,
                quantity: entry.quantity,
              });
              failedCount++;
              continue;
            }

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
            const existingEntry = await tx.daily_sale.findFirst({
              where: {
                dvat04Id: currentDvatId,
                deletedAt: null,
                deletedById: null,
                status: "ACTIVE",
                invoice_number: entry.invoice_number,
                quantity: entry.quantity,
                invoice_date: entry.invoice_date,
                commodity_masterId: entry.commodityid,
                ...(entry.batch_name !== null && {
                  batch_name: entry.batch_name,
                }),
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

            // Get seller TIN
            const purchaser_response = await tx.tin_number_master.findFirst({
              where: {
                status: "ACTIVE",
                deletedAt: null,
                id: entry.seller_tin_id,
              },
            });

            if (!purchaser_response) {
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

            // Get seller DVAT
            const seller_dvat = await tx.dvat04.findFirst({
              where: {
                deletedAt: null,
                deletedById: null,
                id: entry.dvatid,
              },
            });

            if (!seller_dvat) {
              failedEntries.push({
                invoice_number: entry.invoice_number,
                error: "Seller Dvat not found.",
                commodity_id: entry.commodityid,
                commodity_name: commodityName,
                invoice_date: entry.invoice_date,
                quantity: entry.quantity,
              });
              failedCount++;
              continue;
            }

            if (seller_dvat.tinNumber == purchaser_response.tin_number) {
              failedEntries.push({
                invoice_number: entry.invoice_number,
                error: "Invalid TIN number.",
                commodity_id: entry.commodityid,
                commodity_name: commodityName,
                invoice_date: entry.invoice_date,
                quantity: entry.quantity,
              });
              failedCount++;
              continue;
            }

            if (!seller_dvat.tinNumber) {
              failedEntries.push({
                invoice_number: entry.invoice_number,
                error: "Seller Dvat TIN number is not set.",
                commodity_id: entry.commodityid,
                commodity_name: commodityName,
                invoice_date: entry.invoice_date,
                quantity: entry.quantity,
              });
              failedCount++;
              continue;
            }

            // Create daily sale record
            const daily_sale_response = await tx.daily_sale.create({
              data: {
                seller_tin_numberId: entry.seller_tin_id,
                amount_unit: entry.amount_unit,
                dvat04Id: entry.dvatid,
                invoice_number: entry.invoice_number,
                invoice_date: entry.invoice_date,
                commodity_masterId: entry.commodityid,
                quantity: entry.quantity,
                tax_percent: entry.tax_percent,
                amount: entry.amount,
                vatamount: entry.vatamount,
                is_dvat_31: false,
                createdById: currentUserId,
                urn_number: ref_no,
                is_against_cform: entry.against_cfrom,
                is_against_fform: entry.is_against_fform,
                is_exempt: entry.is_exempt ?? false,
                is_against_iform: entry.is_against_iform ?? false,
                is_h_export: entry.is_h_export ?? false,
                is_against_e1: entry.is_against_e1 ?? false,
                is_export: entry.is_export,
                is_local:
                  purchaser_response.tin_number.startsWith("25") ||
                  purchaser_response.tin_number.startsWith("26"),
                is_accept: [1, 2, 821].includes(purchaser_response.id)
                  ? true
                  : !(
                      purchaser_response.tin_number.startsWith("25") ||
                      purchaser_response.tin_number.startsWith("26")
                    ),
                is_paid: entry.invoice_date < new Date("2026-11-01"),
                batch_name: entry.batch_name ?? undefined,
              },
              include: {
                seller_tin_number: true,
              },
            });

            if (!daily_sale_response) {
              failedEntries.push({
                invoice_number: entry.invoice_number,
                error: "Unable to create daily sale.",
                commodity_id: entry.commodityid,
                commodity_name: commodityName,
                invoice_date: entry.invoice_date,
                quantity: entry.quantity,
              });
              failedCount++;
              continue;
            }

            // Update stock if exists (don't fail if not)
            const isexist = await tx.stock.findFirst({
              where: {
                deletedAt: null,
                deletedById: null,
                dvat04Id: daily_sale_response.dvat04Id,
                commodity_masterId: daily_sale_response.commodity_masterId,
              },
            });

            if (isexist) {
              await tx.stock.update({
                where: {
                  id: isexist.id,
                  deletedAt: null,
                  deletedById: null,
                },
                data: {
                  quantity: Math.max(0, isexist.quantity - entry.quantity),
                },
              });
            }

            // Create daily purchase if applicable
            const userstock = await tx.dvat04.findFirst({
              where: {
                deletedAt: null,
                deletedById: null,
                tinNumber: daily_sale_response.seller_tin_number.tin_number,
              },
            });

            if (userstock) {
              if (
                purchaser_response.tin_number.startsWith("25") ||
                purchaser_response.tin_number.startsWith("26") ||
                ![1, 2, 821].includes(purchaser_response.id)
              ) {
                const saller_response = await tx.tin_number_master.findFirst({
                  where: {
                    status: "ACTIVE",
                    deletedAt: null,
                    tin_number: seller_dvat.tinNumber,
                  },
                });

                if (!saller_response) {
                  failedEntries.push({
                    invoice_number: entry.invoice_number,
                    error: "Seller TIN number not found (for purchase).",
                    commodity_id: entry.commodityid,
                    commodity_name: commodityName,
                    invoice_date: entry.invoice_date,
                    quantity: entry.quantity,
                  });
                  failedCount++;
                  continue;
                }

                await tx.daily_purchase.create({
                  data: {
                    dvat04Id: userstock.id,
                    seller_tin_numberId: saller_response.id,
                    invoice_number: entry.invoice_number,
                    invoice_date: entry.invoice_date,
                    commodity_masterId: entry.commodityid,
                    quantity: entry.quantity,
                    tax_percent: entry.tax_percent,
                    amount: entry.amount,
                    amount_unit: entry.amount_unit,
                    vatamount: entry.vatamount,
                    is_dvat_30a: !(
                      seller_dvat.tinNumber.startsWith("25") ||
                      seller_dvat.tinNumber.startsWith("26")
                    ),
                    createdById: currentUserId,
                    is_local:
                      seller_dvat.tinNumber.startsWith("25") ||
                      seller_dvat.tinNumber.startsWith("26"),
                    urn_number: ref_no,
                    payment_status: entry.invoice_date < new Date("2026-11-01")
                      ? "PAID"
                      : "DUE",
                  },
                });
              }
            } else {
              await tx.daily_sale.update({
                where: {
                  id: daily_sale_response.id,
                },
                data: {
                  is_accept: true,
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
        maxWait: 60000, // 60 seconds
        timeout: 300000, // 5 minutes
      },
    );

    return createResponse({
      message: `${result.createdCount} entr${result.createdCount === 1 ? "y" : "ies"} created successfully${result.failedCount > 0 ? `, ${result.failedCount} failed` : ""}.`,
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

export default BulkDailySale;
