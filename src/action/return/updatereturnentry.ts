"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  CategoryOfEntry,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  PurchaseType,
  SaleOf,
  SaleOfInterstate,
  Status,
  returns_entry,
} from "@prisma/client";

interface UpdateReturnEntryPayload {
  id: number;
  updatedById: number;
  invoice_number?: string;
  total_invoice_number?: string;
  seller_tin_numberId?: number;
  invoice_date?: Date;
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
  quantity: number;
  status?: Status;
}

const UpdateReturnEntry = async (
  payload: UpdateReturnEntryPayload
): Promise<ApiResponseType<returns_entry | null>> => {
  const functionname: string = UpdateReturnEntry.name;

  try {
    let returnEntryExist = await prisma.returns_entry.findFirst({
      where: {
        id: payload.id,
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!returnEntryExist) {
      return createResponse({
        message: "Invalid return entry id.Try again.",
        functionname,
      });
    }

    const returnentryresponse = await prisma.returns_entry.update({
      where: {
        id: returnEntryExist.id,
      },
      data: {
        updatedById: payload.updatedById,
        ...(payload.invoice_number && {
          invoice_number: payload.invoice_number,
        }),
        ...(payload.seller_tin_numberId && {
          seller_tin_numberId: payload.seller_tin_numberId,
        }),
        ...(payload.total_invoice_number && {
          total_invoice_number: payload.total_invoice_number,
        }),
        ...(payload.invoice_date && {
          invoice_date: payload.invoice_date.toISOString(),
        }),
        ...(payload.category_of_entry && {
          category_of_entry: payload.category_of_entry,
        }),
        ...(payload.sale_of && { sale_of: payload.sale_of }),
        ...(payload.sale_of_interstate && {
          sale_of_interstate: payload.sale_of_interstate,
        }),
        ...(payload.input_tax_credit && {
          input_tax_credit: payload.input_tax_credit,
        }),
        ...(payload.nature_purchase && {
          nature_purchase: payload.nature_purchase,
        }),
        ...(payload.purchase_type && { purchase_type: payload.purchase_type }),
        ...(payload.nature_purchase_option && {
          nature_purchase_option: payload.nature_purchase_option,
        }),
        ...(payload.place_of_supply && {
          place_of_supply: payload.place_of_supply,
        }),
        ...(payload.tax_percent && { tax_percent: payload.tax_percent }),
        ...(payload.amount && { amount: payload.amount }),
        ...(payload.vatamount && { vatamount: payload.vatamount }),
        ...(payload.remark && { remarks: payload.remark }),
        ...(payload.description_of_goods && {
          description_of_goods: payload.description_of_goods,
        }),
        ...(payload.status && { status: payload.status }),
        ...(payload.quantity && { quantity: payload.quantity }),
      },
    });

    if (!returnentryresponse) {
      return createResponse({
        message: "Return Entry update failed.",
        functionname,
      });
    }

    return createResponse({
      message: "Return Invoice Created successfully",
      functionname,
      data: returnentryresponse,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default UpdateReturnEntry;
