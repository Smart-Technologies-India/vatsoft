"use server";
interface ConvertDvat31Payload {
  dvatid: number;
  createdById: number;
  startDate?: string;
  endDate?: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  CategoryOfEntry,
  commodity_master,
  daily_sale,
  DvatType,
  Quarter,
  returns_01,
  ReturnType,
  SaleOf,
  SaleOfInterstate,
  Status,
  tin_number_master,
} from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

const ConvertDvat31 = async (
  payload: ConvertDvat31Payload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = ConvertDvat31.name;
  const chunkSize = 100;

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

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "ConvertDvat31",
      } as any;
    }

    const shouldUseSelectedPeriod = Boolean(payload.startDate || payload.endDate);

    const invoiceDateFilter: {
      gte?: Date;
      lte?: Date;
    } = {};

    if (payload.startDate) {
      invoiceDateFilter.gte = new Date(payload.startDate);
    }

    if (payload.endDate) {
      const endDate = new Date(payload.endDate);
      endDate.setHours(23, 59, 59, 999);
      invoiceDateFilter.lte = endDate;
    }

    const candidateRows = await prisma.daily_sale.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        status: "ACTIVE",
        dvat04Id: payload.dvatid,
        is_dvat_31: false,
        ...(Object.keys(invoiceDateFilter).length > 0 && {
          invoice_date: invoiceDateFilter,
        }),
      },
      include: {
        seller_tin_number: true,
        commodity_master: true,
      },
      orderBy: {
        invoice_date: "asc",
      },
    });

    if (candidateRows.length === 0) {
      throw new Error("There is no remaning daily sale");
    }

    const targetDate = new Date(candidateRows[0].invoice_date);
    const targetMonth = targetDate.toISOString().slice(0, 7);
    const monthStart = new Date(`${targetMonth}-01`);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const monthEndExclusive = new Date(year, month + 1, 1);

    const data_to_create = shouldUseSelectedPeriod
      ? candidateRows
      : candidateRows.filter((row) => {
          const invoiceDate = new Date(row.invoice_date);
          return invoiceDate >= monthStart && invoiceDate < monthEndExclusive;
        });

    if (data_to_create.length === 0) {
      throw new Error("No sale rows found for selected period.");
    }

    const monthReturns = await prisma.returns_01.findMany({
      where: {
        year: targetDate.getFullYear().toString(),
        month: monthNames[targetDate.getMonth()],
        dvat04Id: payload.dvatid,
        OR: [
          {
            return_type: "REVISED",
          },
          {
            return_type: "ORIGINAL",
          },
        ],
        deletedAt: null,
        deletedById: null,
        status: Status.ACTIVE,
      },
      orderBy: {
        id: "asc",
      },
    });

    const isUnpaid = (rrNumber?: string | null) =>
      rrNumber == null || rrNumber.trim() === "";

    const hasPaidReturnInMonth = monthReturns.some(
      (entry) => !isUnpaid(entry.rr_number),
    );

    if (hasPaidReturnInMonth) {
      throw new Error(
        "Return for this month is already paid. Cannot attach DVAT31 entries.",
      );
    }

    let returnInvoice =
      monthReturns.find(
        (entry) => entry.return_type === "REVISED" && isUnpaid(entry.rr_number),
      ) ||
      monthReturns.find(
        (entry) =>
          entry.return_type === "ORIGINAL" && isUnpaid(entry.rr_number),
      );

    if (!returnInvoice) {
      const dvat04 = await prisma.dvat04.findFirst({
        where: { id: payload.dvatid },
      });

      if (!dvat04) {
        throw new Error("User Dvat04 not found.");
      }

      returnInvoice = await prisma.returns_01.create({
        data: {
          rr_number: "",
          return_type: ReturnType.ORIGINAL,
          year: targetDate.getFullYear().toString(),
          month: monthNames[targetDate.getMonth()],
          quarter: getQuarter(monthNames[targetDate.getMonth()]) as Quarter,
          dvat04Id: dvat04.id,
          filing_datetime: new Date(),
          file_status: Status.ACTIVE,
          total_tax_amount: "0",
          status: Status.ACTIVE,
          compositionScheme: dvat04.compositionScheme,
          createdById: payload.createdById,
        },
      });
    }

    const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstunvxyz", 12);
    const totalRows = data_to_create.length;
    const totalChunks = Math.ceil(totalRows / chunkSize);

    const sellerDvat = await prisma.dvat04.findFirst({
      where: {
        id: payload.dvatid,
        deletedAt: null,
        deletedById: null,
      },
      select: {
        tinNumber: true,
      },
    });

    const stateRows = await prisma.state.findMany({
      where: {
        deletedAt: null,
        status: Status.ACTIVE,
      },
      select: {
        id: true,
        code: true,
      },
    });

    const stateCodeToId = new Map<string, number>();
    for (const state of stateRows) {
      stateCodeToId.set(String(state.code).trim(), state.id);
    }

    const ownTinStateCode = sellerDvat?.tinNumber?.substring(0, 2) ?? "";

    for (let start = 0; start < totalRows; start += chunkSize) {
      const chunkRows = data_to_create.slice(start, start + chunkSize);

      await prisma.$transaction(async (tx) => {
        await tx.returns_entry.createMany({
          data: chunkRows.map(
            (
              val: daily_sale & {
                seller_tin_number: tin_number_master;
                commodity_master: commodity_master;
              },
            ) => {
              const sellerTinCode =
                val.seller_tin_number.tin_number?.substring(0, 2) ?? "";

              const placeOfSupplyId = val.is_local
                ? stateCodeToId.get(ownTinStateCode) ??
                  stateCodeToId.get(sellerTinCode) ??
                  null
                : stateCodeToId.get(sellerTinCode) ?? null;

              return {
                returns_01Id: returnInvoice.id,
                dvat_type: val.is_local ? DvatType.DVAT_31 : DvatType.DVAT_31_A,
                status: Status.ACTIVE,
                createdById: payload.createdById,
                urn_number: nanoid(),
                invoice_date: val.invoice_date,
                invoice_number: val.invoice_number,
                seller_tin_numberId: val.seller_tin_numberId,
                category_of_entry: CategoryOfEntry.INVOICE,
                total_invoice_number: (
                  parseFloat(val.amount) + parseFloat(val.vatamount)
                ).toFixed(2),
                commodity_masterId: val.commodity_masterId,
                ...(val.is_local && {
                  sale_of: SaleOf.GOODS_TAXABLE,
                  place_of_supply: placeOfSupplyId,
                }),
                ...(!val.is_local && {
                  sale_of_interstate: val.is_against_cform
                    ? SaleOfInterstate.FORMC
                    : val.is_against_fform
                      ? SaleOfInterstate.FORMF
                      : val.is_export
                        ? SaleOfInterstate.EXPORT_OUTOF_INDIA
                        : val.is_h_export
                          ? SaleOfInterstate.FORMH
                          : val.is_against_iform
                            ? SaleOfInterstate.FORMI
                            : val.is_against_e1
                              ? SaleOfInterstate.EXEMPT_US6
                              : SaleOfInterstate.TAXABLE_SALE,
                  place_of_supply: placeOfSupplyId,
                }),
                tax_percent: val.tax_percent,
                amount: parseFloat(val.amount).toFixed(2),
                vatamount: parseFloat(val.vatamount).toFixed(2),
                quantity: val.quantity,
                remarks: "",
                description_of_goods: val.commodity_master.product_name,
              };
            },
          ),
        });

        const updateResponse = await tx.daily_sale.updateMany({
          where: {
            deletedAt: null,
            deletedBy: null,
            status: "ACTIVE",
            dvat04Id: payload.dvatid,
            is_dvat_31: false,
            id: {
              in: chunkRows.map((item) => item.id),
            },
          },
          data: {
            is_dvat_31: true,
            updatedById: payload.createdById,
          },
        });

        if (updateResponse.count !== chunkRows.length) {
          throw new Error("Unable to update one or more sale rows.");
        }
      });
    }

    return createResponse({
      message: `Convert to DVAT 31/31 A Completed. Processed ${totalRows} sale row(s) in ${totalChunks} batch(es) of ${chunkSize}.`,
      functionname,
      data: returnInvoice,
    });
  } catch (e) {
    console.error(`Error in ${functionname}:`, e);
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default ConvertDvat31;

const getQuarter = (month: string): string => {
  // Define the mapping of months to quarters
  const quarterMap: {
    [key: string]: "QUARTER1" | "QUARTER2" | "QUARTER3" | "QUARTER4";
  } = {
    April: "QUARTER1",
    May: "QUARTER1",
    June: "QUARTER1",
    July: "QUARTER2",
    August: "QUARTER2",
    September: "QUARTER2",
    October: "QUARTER3",
    November: "QUARTER3",
    December: "QUARTER3",
    January: "QUARTER4",
    February: "QUARTER4",
    March: "QUARTER4",
  };

  // Return the corresponding quarter for the given month
  return quarterMap[month] || "QUARTER1";
};
