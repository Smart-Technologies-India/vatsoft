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
  returns_entry,
} from "@prisma/client";

interface AddNilPayload {
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

const AddNil = async (
  payload: AddNilPayload
): Promise<ApiResponseType<returns_entry | null>> => {
  const functionname: string = AddNil.name;

  try {
    let returnInvoice = await prisma.returns_01.findFirst({
      where: {
        year: payload.year,
        month: payload.month,
        createdById: payload.createdById,
      },
    });

    if (returnInvoice) {
      return createResponse({
        message: "Entry already exist for this month. Please try again.",
        functionname,
      });
    }

    const dvat04 = await prisma.dvat04.findFirst({
      where: { createdById: payload.createdById },
      orderBy: {
        createdAt: "asc",
      },
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
        return_type: "ORIGNAL",
        year: payload.year,
        quarter: payload.quarter,
        month: payload.month,
        dvat04Id: dvat04.id,
        filing_datetime: new Date(),
        file_status: Status.ACTIVE,
        total_tax_amount: "0",
        status: Status.ACTIVE,
        createdById: payload.createdById,
      },
    });

    // const returnentryresponse = await prisma.returns_entry.create({
    //   data: {
    //     isnil: true,
    //     returns_01Id: returnInvoice.id,

      
    //     status: Status.ACTIVE,
    //     createdById: payload.createdById,
    //   },
    // });

    // if (!returnentryresponse)
    //   return {
    //     status: false,
    //     data: null,
    //     message: "Invalid id. Please try again.",
    //     functionname: "AddReturnInvoice",
    //   };

    return {
      status: true,
      data: null,
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

export default AddNil;
