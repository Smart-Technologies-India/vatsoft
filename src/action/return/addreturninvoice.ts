"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  CategoryOfEntry,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  PurchaseType,
  Quarter,
  ReturnType,
  SaleOf,
  SaleOfInterstate,
  Status,
  returns_entry,
} from "@prisma/client";

interface AddReturnInvoicePayload {
  year: string;
  month: string;
  quarter: Quarter;
  createdById: number;
  rr_number: string;
  returnType: ReturnType;
  total_tax_amount: string;
  dvat_type: DvatType;
  urn_number: string;
  invoice_number: string;
  total_invoice_number: string;
  invoice_date: Date;
  seller_tin_numberId: number;
  category_of_entry?: CategoryOfEntry;
  sale_of?: SaleOf;
  sale_of_interstate?: SaleOfInterstate;
  input_tax_credit?: InputTaxCredit;
  nature_purchase?: NaturePurchase;
  nature_purchase_option?: NaturePurchaseOption;
  purchase_type?: PurchaseType;
  place_of_supply?: number;
  tax_percent?: string;
  amount?: string;
  vatamount?: string;
  remark?: string;
  description_of_goods?: string;
}

const AddReturnInvoice = async (
  payload: AddReturnInvoicePayload
): Promise<ApiResponseType<returns_entry | null>> => {
  try {
    let returnInvoice = await prisma.returns_01.findFirst({
      where: {
        year: payload.year,
        month: payload.month,
        createdById: payload.createdById,
      },
    });

    if (!returnInvoice) {
      const dvat04 = await prisma.dvat04.findFirst({
        where: { createdById: payload.createdById },
      });

      if (!dvat04) {
        return {
          status: false,
          data: null,
          message: "User Dvat04 not found.",
          functionname: "AddReturnInvoice",
        };
      }

      returnInvoice = await prisma.returns_01.create({
        data: {
          rr_number: payload.rr_number,
          return_type: payload.returnType,
          year: payload.year,
          quarter: payload.quarter,
          month: payload.month,
          dvat04Id: dvat04.id,
          filing_datetime: new Date(),
          file_status: Status.ACTIVE,
          total_tax_amount: payload.total_tax_amount,
          status: Status.ACTIVE,
          createdById: payload.createdById,
        },
      });
    }

    const returnentryresponse = await prisma.returns_entry.create({
      data: {
        returns_01Id: returnInvoice.id,
        dvat_type: payload.dvat_type,
        urn_number: payload.urn_number,
        invoice_number: payload.invoice_number,
        total_invoice_number: payload.total_invoice_number,
        invoice_date: payload.invoice_date,
        seller_tin_numberId: payload.seller_tin_numberId,
        category_of_entry: payload.category_of_entry,
        sale_of: payload.sale_of,
        sale_of_interstate: payload.sale_of_interstate,
        input_tax_credit: payload.input_tax_credit,
        nature_purchase: payload.nature_purchase,
        purchase_type: payload.purchase_type,
        nature_purchase_option: payload.nature_purchase_option,
        place_of_supply: payload.place_of_supply,
        tax_percent: payload.tax_percent,
        amount: payload.amount,
        vatamount: payload.vatamount,
        remarks: payload.remark,
        description_of_goods: payload.description_of_goods,
        status: Status.ACTIVE,
        createdById: payload.createdById,
      },
    });

    if (!returnentryresponse)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "AddReturnInvoice",
      };

    return {
      status: true,
      data: returnentryresponse,
      message: "Return Invoice Created successfully",
      functionname: "AddReturnInvoice",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "AddReturnInvoice",
    };
    return response;
  }
};

export default AddReturnInvoice;
