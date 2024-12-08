"use server";
interface ConvertDvat31Payload {
  dvatid: number;
  createdById: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  CategoryOfEntry,
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
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

const ConvertDvat31 = async (
  payload: ConvertDvat31Payload
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = ConvertDvat31.name;

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
      const data_to_create = await prisma.daily_sale.findMany({
        where: {
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
          is_dvat_31: false,
        },
        include: {
          seller_tin_number: true,
        },
      });

      if (data_to_create.length == 0) {
        throw new Error("There is no remaning daily purchase");
      }

      const update_response = await prisma.daily_sale.updateMany({
        where: {
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
          is_dvat_31: false,
        },
        data: {
          is_dvat_31: true,
          updatedById: payload.createdById,
        },
      });

      if (!update_response) {
        throw new Error("Something want wrong unable to update.");
      }
      const current_date = new Date();

      let returnInvoice = await prisma.returns_01.findFirst({
        where: {
          year: current_date.getFullYear().toString(),
          month: monthNames[current_date.getMonth()],
          createdById: payload.createdById,
          return_type: "REVISED",
        },
      });

      if (!returnInvoice) {
        returnInvoice = await prisma.returns_01.findFirst({
          where: {
            year: current_date.getFullYear().toString(),
            month: monthNames[current_date.getMonth()],
            createdById: payload.createdById,
            return_type: "ORIGINAL",
          },
        });
      }

      if (!returnInvoice) {
        const dvat04 = await prisma.dvat04.findFirst({
          where: { createdById: payload.createdById },
        });

        if (!dvat04) {
          throw new Error("User Dvat04 not found.");
        }

        returnInvoice = await prisma.returns_01.create({
          data: {
            rr_number: "",
            return_type: ReturnType.ORIGINAL,
            year: current_date.getFullYear().toString(),
            month: monthNames[current_date.getMonth()],
            quarter: getQuarter(monthNames[current_date.getMonth()]) as Quarter,
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
          (val: daily_sale & { seller_tin_number: tin_number_master }) => ({
            returns_01Id: returnInvoice.id,
            dvat_type: val.is_local ? DvatType.DVAT_31 : DvatType.DVAT_31_A,
            status: Status.ACTIVE,
            createdById: payload.createdById,
            urn_number: nanoid(),
            invoice_date: val.invoice_date,
            invoice_number: val.invoice_number,
            seller_tin_numberId: val.seller_tin_numberId,
            category_of_entry: CategoryOfEntry.INVOICE,
            total_invoice_number: val.amount,
            commodity_masterId: val.commodity_masterId,
            ...(val.is_local && {
              sale_of: SaleOf.GOODS_TAXABLE,
              place_of_supply: 26,
            }),
            ...(!val.is_local && {
              SaleOfInterstate: SaleOfInterstate.TAXABLE_SALE,
              place_of_supply: parseInt(
                val.seller_tin_number.tin_number.substring(0, 2)
              ),
            }),
            tax_percent: val.tax_percent,
            amount: val.amount,
            vatamount: val.vatamount,
            quantity: val.quantity,
            remarks: "",
          })
        ),
      });

      if (!returnentryresponse) {
        throw new Error("Unable to convert to DVAT 31.");
      }

      return returnInvoice;
    });

    return createResponse({
      message: "Convert to convert to DVAT 31 Completed.",
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
