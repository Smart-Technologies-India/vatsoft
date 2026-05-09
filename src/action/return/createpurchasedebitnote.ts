"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  CategoryOfEntry,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  Quarter,
  ReturnType,
  returns_entry,
  Status,
} from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

interface CreatePurchaseDebitNotePayload {
  dvat04Id: number;
  debit_invoice_number: string;
  debit_invoice_date: Date;
  seller_tin_numberId: number;
  seller_tin_number_str: string;
  taxable_amount: string;
  vat_amount: string;
  total_invoice_value: string;
  original_invoice_number: string;
  original_invoice_date: Date;
  quantity: number;
  commodity_masterId: number;
  createdById: number;
  urn_number: string;
}

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

function getQuarter(month: string): Quarter {
  const quarters: Record<string, Quarter> = {
    January: "QUARTER3",
    February: "QUARTER3",
    March: "QUARTER3",
    April: "QUARTER4",
    May: "QUARTER4",
    June: "QUARTER4",
    July: "QUARTER1",
    August: "QUARTER1",
    September: "QUARTER1",
    October: "QUARTER2",
    November: "QUARTER2",
    December: "QUARTER2",
  };
  return quarters[month] ?? "QUARTER1";
}

const CreatePurchaseDebitNote = async (
  payload: CreatePurchaseDebitNotePayload,
): Promise<ApiResponseType<returns_entry | null>> => {
  const functionname = CreatePurchaseDebitNote.name;
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "CreatePurchaseDebitNote",
      } as any;
    }

    const invoiceDate = new Date(payload.debit_invoice_date);
    const year = invoiceDate.getFullYear().toString();
    const monthName = monthNames[invoiceDate.getMonth()];

    const origDate = new Date(payload.original_invoice_date);
    const origDateStr = `${String(origDate.getDate()).padStart(2, "0")}-${String(origDate.getMonth() + 1).padStart(2, "0")}-${origDate.getFullYear()}`;
    const descriptionOfGoods = payload.urn_number;

    const dvat_type =
      payload.seller_tin_number_str.startsWith("25") ||
      payload.seller_tin_number_str.startsWith("26")
        ? DvatType.DVAT_30
        : DvatType.DVAT_30_A;

    let returnInvoice = await prisma.returns_01.findFirst({
      where: {
        year,
        month: monthName,
        dvat04Id: payload.dvat04Id,
        return_type: "REVISED",
      },
    });

    if (!returnInvoice) {
      returnInvoice = await prisma.returns_01.findFirst({
        where: {
          year,
          month: monthName,
          dvat04Id: payload.dvat04Id,
          return_type: "ORIGINAL",
        },
      });
    }

    if (!returnInvoice) {
      const dvat04 = await prisma.dvat04.findFirst({ where: { id: payload.dvat04Id } });
      if (!dvat04) throw new Error("DVAT04 record not found.");

      returnInvoice = await prisma.returns_01.create({
        data: {
          rr_number: "",
          return_type: ReturnType.ORIGINAL,
          year,
          month: monthName,
          quarter: getQuarter(monthName),
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

    const entry = await prisma.returns_entry.create({
      data: {
        returns_01Id: returnInvoice.id,
        dvat_type,
        urn_number: nanoid(),
        invoice_number: payload.debit_invoice_number,
        invoice_date: invoiceDate,
        total_invoice_number: parseFloat(payload.total_invoice_value).toFixed(2),
        seller_tin_numberId: payload.seller_tin_numberId,
        category_of_entry: CategoryOfEntry.DEBIT_NOTE,
        input_tax_credit: InputTaxCredit.ITC_ELIGIBLE,
        nature_purchase: NaturePurchase.OTHER_GOODS,
        nature_purchase_option: NaturePurchaseOption.REGISTER_DEALERS,
        amount: parseFloat(payload.taxable_amount).toFixed(2),
        vatamount: parseFloat(payload.vat_amount).toFixed(2),
        quantity: payload.quantity,
        commodity_masterId: payload.commodity_masterId,
        description_of_goods: descriptionOfGoods,
        status: Status.ACTIVE,
        createdById: payload.createdById,
      },
    });

    return createResponse({
      message: "Purchase debit note entry created successfully.",
      functionname,
      data: entry,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreatePurchaseDebitNote;
