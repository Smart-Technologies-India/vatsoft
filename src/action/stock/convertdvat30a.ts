"use server";
interface ConvertDvat30APayload {
  dvatid: number;
  createdById: number;
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
    const result: returns_01 = await prisma.$transaction(async (prisma) => {
      const lowestMonth = await prisma.daily_purchase.findFirst({
        where: {
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
          is_dvat_30a: false,
        },
        orderBy: {
          invoice_date: "asc", // Sort by date to get the earliest month
        },
        select: {
          invoice_date: true,
        },
      });

      if (!lowestMonth) {
        throw new Error("No records found");
      }
      const targetDate = new Date(lowestMonth.invoice_date);
      const targetMonth = new Date(lowestMonth.invoice_date)
        .toISOString()
        .slice(0, 7); // Extract YYYY-MM format

      const year = parseInt(targetMonth.split("-")[0], 10);
      const month = parseInt(targetMonth.split("-")[1], 10);

      // Calculate the first day of the next month
      const startOfNextMonth = new Date(year, month, 1); // Year and month are 0-indexed in JS Date

      // Calculate the last day of the target month
      const endOfMonth = new Date(startOfNextMonth.getTime() - 1).toISOString();

      const data_to_create = await prisma.daily_purchase.findMany({
        where: {
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
          is_dvat_30a: false,
          invoice_date: {
            gte: new Date(`${targetMonth}-01`), // Start of the month
            lt: endOfMonth, // End of the month
          },
        },
        include: {
          commodity_master: true,
          seller_tin_number: true,
        },
      });

      if (data_to_create.length == 0) {
        throw new Error("There is no remaning daily purchase");
      }

      const update_response = await prisma.daily_purchase.updateMany({
        where: {
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
          is_dvat_30a: false,
          invoice_date: {
            gte: new Date(`${targetMonth}-01`), // Start of the month
            lt: endOfMonth, // End of the month
          },
        },
        data: {
          is_dvat_30a: true,
          updatedById: payload.createdById,
        },
      });

      if (!update_response) {
        throw new Error("Something went wrong unable to update.");
      }
      // const current_date = new Date();

      let returnInvoice = await prisma.returns_01.findFirst({
        where: {
          year: targetDate.getFullYear().toString(),
          month: monthNames[targetDate.getMonth()],
          return_type: "REVISED",
          dvat04Id: payload.dvatid,
        },
      });

      if (!returnInvoice) {
        returnInvoice = await prisma.returns_01.findFirst({
          where: {
            year: targetDate.getFullYear().toString(),
            month: monthNames[targetDate.getMonth()],
            return_type: "ORIGINAL",
            dvat04Id: payload.dvatid,
          },
        });
      }

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
            createdById: payload.createdById,
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
              !val.is_against_cform && {
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

      return returnInvoice;
    });

    return createResponse({
      message: "Convert to DVAT 30/30 A Completed.",
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
