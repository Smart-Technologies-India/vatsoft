"use server";
interface ConvertDvat30APayload {
  dvatid: number;
  startDate?: string;
  endDate?: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  CategoryOfEntry,
  commodity_master,
  daily_purchase,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  PurchaseType,
  Quarter,
  returns_01,
  ReturnType,
  Status,
  tin_number_master,
} from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

const ConvertDvat30A = async (
  payload: ConvertDvat30APayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = ConvertDvat30A.name;

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
        functionname: "ConvertDvat30A",
      } as any;
    }

    let returnInvoiceResult: returns_01 | null = null;

    const april2026 = new Date(2026, 3, 1);
    const startOfMonth = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), 1);
    const addMonths = (date: Date, months: number) =>
      new Date(date.getFullYear(), date.getMonth() + months, 1);

    await prisma.$transaction(async (prisma) => {
      const dvat04 = await prisma.dvat04.findFirst({
        where: { id: payload.dvatid },
      });

      if (!dvat04) {
        throw new Error("User Dvat04 not found.");
      }

      const shouldUseSelectedPeriod = Boolean(
        payload.startDate || payload.endDate,
      );

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

      const candidateRows = await prisma.daily_purchase.findMany({
        where: {
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
          is_dvat_30a: false,
          ...(Object.keys(invoiceDateFilter).length > 0 && {
            invoice_date: invoiceDateFilter,
          }),
        },
        include: {
          commodity_master: true,
          seller_tin_number: true,
        },
      });

      if (candidateRows.length === 0) {
        throw new Error("There is no remaning daily purchase");
      }

      const lowestInvoiceDate = candidateRows.reduce((minDate, row) => {
        const rowDate = new Date(row.invoice_date);
        return rowDate < minDate ? rowDate : minDate;
      }, new Date(candidateRows[0].invoice_date));

      const targetStartDate =
        startOfMonth(lowestInvoiceDate).getTime() < april2026.getTime()
          ? april2026
          : startOfMonth(lowestInvoiceDate);

      const targetEndDate = addMonths(targetStartDate, 1);

      const data_to_create = shouldUseSelectedPeriod
        ? candidateRows
        : candidateRows.filter((row) => {
            const invoiceDate = new Date(row.invoice_date);
            if (targetStartDate.getTime() === april2026.getTime()) {
              return invoiceDate < targetEndDate;
            }

            return invoiceDate >= targetStartDate && invoiceDate < targetEndDate;
          });

      if (data_to_create.length === 0) {
        throw new Error("No purchase rows found for selected period.");
      }

      let cursorDate = targetStartDate;
      let returnInvoice: returns_01 | null = null;

      for (let monthAttempts = 0; monthAttempts < 24; monthAttempts += 1) {
        const monthStartDate = startOfMonth(cursorDate);
        const monthEndDate = addMonths(monthStartDate, 1);
      

        const monthName = monthNames[monthStartDate.getMonth()];
        const monthYear = monthStartDate.getFullYear().toString();


        const monthReturns = await prisma.returns_01.findMany({
          where: {
            year: monthYear,
            month: monthName,
            dvat04Id: payload.dvatid,
            OR: [{ return_type: "REVISED" }, { return_type: "ORIGINAL" }],
            deletedAt: null,
            deletedById: null,
            // status: "ACTIVE",
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
          cursorDate = monthEndDate;
          continue;
        }

        const unpaidReturn =
          monthReturns.find(
            (entry) =>
              entry.return_type === "REVISED" && isUnpaid(entry.rr_number),
          ) ||
          monthReturns.find(
            (entry) =>
              entry.return_type === "ORIGINAL" && isUnpaid(entry.rr_number),
          );

        if (unpaidReturn) {
          returnInvoice = unpaidReturn;
          break;
        }

        returnInvoice = await prisma.returns_01.create({
          data: {
            rr_number: "",
            return_type: ReturnType.ORIGINAL,
            year: monthYear,
            month: monthName,
            quarter: getQuarter(monthName) as Quarter,
            dvat04Id: dvat04.id,
            filing_datetime: new Date(),
            file_status: Status.ACTIVE,
            total_tax_amount: "0",
            status: Status.ACTIVE,
            compositionScheme: dvat04.compositionScheme,
            createdById: currentUserId,
          },
        });
        break;
      }

      if (!returnInvoice) {
        throw new Error("No eligible unpaid return found.");
      }

      const update_response = await prisma.daily_purchase.updateMany({
        where: {
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
          is_dvat_30a: false,
          id: {
            in: data_to_create.map((item) => item.id),
          },
        },
        data: {
          is_dvat_30a: true,
          updatedById: currentUserId,
        },
      });

      if (!update_response) {
        throw new Error("Something went wrong unable to update.");
      }

      const nanoid = customAlphabet(
        "1234567890abcdefghijklmnopqrstunvxyz",
        12,
      );

      const returnentryresponse = await prisma.returns_entry.createMany({
        data: data_to_create.map(
          (
            val: daily_purchase & {
              seller_tin_number: tin_number_master;
              commodity_master: commodity_master;
            },
          ) => ({
            returns_01Id: returnInvoice.id,
            dvat_type: val.is_local ? DvatType.DVAT_30 : DvatType.DVAT_30_A,
            status: Status.ACTIVE,
            createdById: currentUserId,
            urn_number: nanoid(),
            invoice_date: val.invoice_date,
            invoice_number: val.invoice_number,
            seller_tin_numberId: val.seller_tin_numberId,
            category_of_entry: CategoryOfEntry.INVOICE,

            // total_invoice_number: !val.is_local
            //   ? (parseFloat(val.amount) + parseFloat(val.vatamount)).toFixed(2)
            //   : val.amount ?? "0",
            total_invoice_number: (
              parseFloat(val.amount) + parseFloat(val.vatamount)
            ).toFixed(2),

            commodity_masterId: val.commodity_masterId,
            ...(val.is_local && {
              purchase_type: PurchaseType.TAXABLE_RATE,
              // place_of_supply: parseInt(
              //   val.seller_tin_number.tin_number.substring(0, 2)
              // ),
            }),
            ...(!val.is_local &&
              val.is_against_cform && {
                purchase_type: PurchaseType.FORMC_CONCESSION,
              }),
            ...(!val.is_local &&
              val.is_against_fform && {
                purchase_type: PurchaseType.STOCK_TRANSFER,
              }),
            ...(!val.is_local &&
              val.is_export && {
                purchase_type: PurchaseType.OUTSIDE_INDIA,
              }),

              

            ...(!val.is_local &&
              !val.is_against_cform &&
              !val.is_against_fform &&
              !val.is_export && {
                purchase_type: PurchaseType.TAXABLE_RATE,
              }),



            // ...(!val.is_local && {
            //   nature_purchase: NaturePurchase.CAPITAL_GOODS,
            //   nature_purchase_option: NaturePurchaseOption.REGISTER_DEALERS,
            //   input_tax_credit: InputTaxCredit.ITC_ELIGIBLE,
            //   place_of_supply: parseInt(
            //     val.seller_tin_number.tin_number.substring(0, 2)
            //   ),
            // }),

            nature_purchase: NaturePurchase.OTHER_GOODS,
            nature_purchase_option: NaturePurchaseOption.REGISTER_DEALERS,
            input_tax_credit: InputTaxCredit.ITC_ELIGIBLE,
            place_of_supply: parseInt(
              val.seller_tin_number.tin_number.substring(0, 2),
            ),
            tax_percent: val.tax_percent,
            // ...(val.is_local && {
            //   amount: (
            //     parseFloat(val.amount) - parseFloat(val.vatamount)
            //   ).toFixed(2),
            // }),
            // ...(!val.is_local && {
            //   amount: val.amount,
            // }),
            amount: val.amount,
            vatamount: val.vatamount,
            remarks: "",
            quantity: val.quantity,
            description_of_goods: val.commodity_master.product_name,
          }),
        ),
      });

      if (!returnentryresponse) {
        throw new Error("Unable to convert to DVAT 30/30 A.");
      }

      returnInvoiceResult = returnInvoice;
      return returnInvoice;

     
    });

    return createResponse({
      message: "Convert to DVAT 30/30 A Completed.",
      functionname,
      data: returnInvoiceResult,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default ConvertDvat30A;

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
