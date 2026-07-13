"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  creditdebitnote,
  commodity_master,
  tin_number_master,
  ReturnType,
  Quarter,
  Status,
  DvatType,
  CategoryOfEntry,
  PurchaseType,
  InputTaxCredit,
  NaturePurchaseOption,
  NaturePurchase,
  SaleOf,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";
import { customAlphabet } from "nanoid";

interface CreateDvatCreditDebitNotePayload {
  invoice_number: string;
  invoice_date: Date;
  commodity_master_id: number;
  seller_tin_number_id: number;
  quantity: number;
  amount_unit: string;
  tax_percent: string;
  amount: string;
  vatamount: string;
  invoice_amount: string;
  is_purchase: boolean;
  is_credit: boolean;
  is_goods_returned: boolean;
  creditnote_no: string;
  creditnote_date: Date;
}

const ALLOWED_COMMODITY_IDS = [1, 2, 748, 749];

type CreditDebitNoteWithRelations = creditdebitnote & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
};

const CreateDvatCreditDebitNote = async (
  payload: CreateDvatCreditDebitNotePayload,
): Promise<ApiResponseType<CreditDebitNoteWithRelations | null>> => {
  const functionname: string = CreateDvatCreditDebitNote.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return createResponse({
        message: "Not authenticated. Please login.",
        functionname,
      });
    }

    // Validate invoice number
    if (!payload.invoice_number?.trim()) {
      return createResponse({
        message: "Invoice number is required.",
        functionname,
      });
    }

    // Validate credit/debit note number
    if (!payload.creditnote_no?.trim()) {
      return createResponse({
        message: "Credit/Debit note number is required.",
        functionname,
      });
    }

    // Validate quantity
    if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
      return createResponse({
        message: "Quantity must be greater than 0.",
        functionname,
      });
    }

    // Validate commodity exists and is in allowed list
    const commodity = await prisma.commodity_master.findFirst({
      where: {
        id: payload.commodity_master_id,
        status: "ACTIVE",
        deletedAt: null,
      },
    });

    if (!commodity) {
      return createResponse({
        message: "Selected commodity not found.",
        functionname,
      });
    }

    // Get current DVAT record
    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        id: currentDvatId,
        status: "APPROVED",
        deletedAt: null,
        deletedById: null,
      },
      include: {
        tin_master: true,
      },
    });

    if (!dvat04) {
      return createResponse({
        message: "DVAT profile not found.",
        functionname,
      });
    }

    // Validate that the seller_tin_number_id belongs to this DVAT
    const tinNumber = await prisma.tin_number_master.findFirst({
      where: {
        id: payload.seller_tin_number_id,
        status: "ACTIVE",
        deletedAt: null,
      },
    });

    if (!tinNumber) {
      return createResponse({
        message: "Selected TIN number not found.",
        functionname,
      });
    }

    // Validate amounts
    const amount = parseFloat(payload.amount || "0");
    const vatAmount = parseFloat(payload.vatamount || "0");
    const invoiceAmount = parseFloat(payload.invoice_amount || "0");

    if (!Number.isFinite(amount) || amount < 0) {
      return createResponse({
        message: "Taxable amount must be valid.",
        functionname,
      });
    }

    if (!Number.isFinite(vatAmount) || vatAmount < 0) {
      return createResponse({
        message: "VAT amount must be valid.",
        functionname,
      });
    }

    if (!Number.isFinite(invoiceAmount) || invoiceAmount < 0) {
      return createResponse({
        message: "Invoice amount must be valid.",
        functionname,
      });
    }

    // Validate dates
    const invoiceDate = new Date(payload.invoice_date);
    const creditnoteDate = new Date(payload.creditnote_date);

    if (Number.isNaN(invoiceDate.getTime())) {
      return createResponse({
        message: "Invalid invoice date.",
        functionname,
      });
    }

    if (Number.isNaN(creditnoteDate.getTime())) {
      return createResponse({
        message: "Invalid credit/debit note date.",
        functionname,
      });
    }

    // Create the credit/debit note
    const note = await prisma.creditdebitnote.create({
      data: {
        dvat04Id: payload.seller_tin_number_id,
        invoice_number: payload.invoice_number.trim(),
        invoice_date: invoiceDate,
        commodity_masterId: payload.commodity_master_id,
        seller_tin_numberId: currentDvatId,
        quantity: payload.quantity,
        amount_unit: payload.amount_unit,
        tax_percent: payload.tax_percent,
        amount: payload.amount,
        vatamount: payload.vatamount,
        invoice_amount: payload.invoice_amount,
        is_purchase: payload.is_purchase,
        is_credit: payload.is_credit,
        is_goods_returned: payload.is_goods_returned,
        creditnote_no: payload.creditnote_no.trim(),
        creditnote_date: creditnoteDate,
        status: "ACTIVE",
        createdById: currentUserId,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
    });

    const months = [
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

    const year = creditnoteDate.getFullYear();
    const month = months[creditnoteDate.getMonth()];

    let returncheck = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: currentDvatId,
        year: year.toString(),
        month: month,
      },
    });

    if (!returncheck) {
      returncheck = await prisma.returns_01.create({
        data: {
          return_type: ReturnType.ORIGINAL,
          rr_number: "",
          quarter: getQuarter(month) as Quarter,
          filing_datetime: new Date(),
          file_status: Status.ACTIVE,
          dvat04Id: currentDvatId,
          year: year.toString(),
          month: month,
          status: "ACTIVE",
          createdById: currentUserId,
        },
      });
    }

    // delete nil entry
    await prisma.returns_entry.updateMany({
      where: {
        returns_01Id: returncheck.id,
        isnil: true,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        deletedById: currentUserId,
      },
    });

    const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstunvxyz", 12);

    await prisma.returns_entry.create({
      data: {
        returns_01Id: returncheck.id,
        dvat_type: DvatType.DVAT_31,
        status: Status.ACTIVE,
        createdById: currentUserId,
        urn_number: nanoid(),
        sale_of: SaleOf.GOODS_TAXABLE,
        invoice_date: creditnoteDate,
        invoice_number: payload.creditnote_no.trim(),
        seller_tin_numberId: payload.seller_tin_number_id,
        category_of_entry: payload.is_goods_returned
          ? CategoryOfEntry.GOODS_RETURNED
          : payload.is_credit
            ? CategoryOfEntry.CREDIT_NOTE
            : CategoryOfEntry.DEBIT_NOTE,
        total_invoice_number: (
          parseFloat(payload.amount) + parseFloat(payload.vatamount)
        ).toFixed(2),
        commodity_masterId: payload.commodity_master_id,
        input_tax_credit: InputTaxCredit.ITC_ELIGIBLE,
        place_of_supply: 25,
        tax_percent: payload.tax_percent,
        amount: payload.amount,
        vatamount: payload.vatamount,
        remarks: "",
        quantity: payload.quantity,
        description_of_goods: commodity.product_name,
      },
    });

    let returnchecksale = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: payload.seller_tin_number_id,
        year: year.toString(),
        month: month,
      },
    });

    if (!returnchecksale) {
      returnchecksale = await prisma.returns_01.create({
        data: {
          return_type: ReturnType.ORIGINAL,
          rr_number: "",
          quarter: getQuarter(month) as Quarter,
          filing_datetime: new Date(),
          file_status: Status.ACTIVE,
          dvat04Id: payload.seller_tin_number_id,
          year: year.toString(),
          month: month,
          status: "ACTIVE",
          createdById: currentUserId,
        },
      });
    }

    // delete nil entry
    await prisma.returns_entry.updateMany({
      where: {
        returns_01Id: returnchecksale.id,
        isnil: true,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        deletedById: currentUserId,
      },
    });

    await prisma.returns_entry.create({
      data: {
        returns_01Id: returnchecksale.id,
        dvat_type: DvatType.DVAT_30,
        status: Status.ACTIVE,
        createdById: currentUserId,
        urn_number: nanoid(),
        invoice_date: creditnoteDate,
        invoice_number: payload.creditnote_no.trim(),
        seller_tin_numberId: currentDvatId,
        category_of_entry: payload.is_goods_returned
          ? CategoryOfEntry.GOODS_RETURNED
          : payload.is_credit
            ? CategoryOfEntry.DEBIT_NOTE
            : CategoryOfEntry.CREDIT_NOTE,
        total_invoice_number: (
          parseFloat(payload.amount) + parseFloat(payload.vatamount)
        ).toFixed(2),
        commodity_masterId: payload.commodity_master_id,
        purchase_type: PurchaseType.TAXABLE_RATE,
        nature_purchase: NaturePurchase.OTHER_GOODS,
        nature_purchase_option: NaturePurchaseOption.REGISTER_DEALERS,
        input_tax_credit: InputTaxCredit.ITC_ELIGIBLE,
        place_of_supply: 25,
        tax_percent: payload.tax_percent,
        amount: payload.amount,
        vatamount: payload.vatamount,
        remarks: "",
        quantity: payload.quantity,
        description_of_goods: commodity.product_name,
      },
    });

    return createResponse({
      message: "Credit/Debit note created successfully.",
      functionname,
      data: note,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default CreateDvatCreditDebitNote;

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
