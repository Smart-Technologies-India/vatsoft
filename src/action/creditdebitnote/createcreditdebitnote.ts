"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  creditdebitnote,
  commodity_master,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface CreateCreditDebitNotePayload {
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

const CreateCreditDebitNote = async (
  payload: CreateCreditDebitNotePayload,
): Promise<ApiResponseType<CreditDebitNoteWithRelations | null>> => {
  const functionname: string = CreateCreditDebitNote.name;

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

    if (!ALLOWED_COMMODITY_IDS.includes(commodity.id)) {
      return createResponse({
        message: "Selected commodity is not allowed for credit/debit notes.",
        functionname,
      });
    }

    // Validate tin number exists
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
        dvat04Id: currentDvatId,
        invoice_number: payload.invoice_number.trim(),
        invoice_date: invoiceDate,
        commodity_masterId: payload.commodity_master_id,
        seller_tin_numberId: payload.seller_tin_number_id,
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

export default CreateCreditDebitNote;
