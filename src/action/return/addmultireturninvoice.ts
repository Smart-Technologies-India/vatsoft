"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
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
} from "@prisma/client";

interface DvatDataType {
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
  remarks?: string;
  description_of_goods?: string;
  quantity: number;
}

interface AddMultiReturnInvoicePayload {
  year: string;
  month: string;
  quarter: Quarter;
  createdById: number;
  rr_number: string;
  returnType: ReturnType;
  total_tax_amount: string;
  dvat_type: DvatType;
  urn_number: string;
  dvat_data: DvatDataType[];
}

const AddMultiReturnInvoice = async (
  payload: AddMultiReturnInvoicePayload
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = AddMultiReturnInvoice.name;

  try {
    let returnInvoice = await prisma.returns_01.findFirst({
      where: {
        year: payload.year,
        month: payload.month,
        createdById: payload.createdById,
        return_type: "REVISED",
      },
    });

    if (!returnInvoice) {
      returnInvoice = await prisma.returns_01.findFirst({
        where: {
          year: payload.year,
          month: payload.month,
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
          compositionScheme: dvat04.compositionScheme,
          createdById: payload.createdById,
        },
      });
    }

    const returnentryresponse = await prisma.returns_entry.createMany({
      data: payload.dvat_data.map((val: DvatDataType) => ({
        returns_01Id: returnInvoice.id,
        dvat_type: payload.dvat_type,
        status: Status.ACTIVE,
        createdById: payload.createdById,
        urn_number: payload.urn_number,
        ...val,
      })),
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
      data: true,
      message: "Return Invoice Created successfully",
      functionname: "AddReturnInvoice",
    };
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AddMultiReturnInvoice;
