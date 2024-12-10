"use server";
interface CreateMaterialPayload {
  dvatid: number;
  commodityid: number;
  quantity: number;
  seller_tin_id: number;
  invoice_number: string;
  invoice_date: Date;
  tax_percent: string;
  amount: string;
  vatamount: string;
  amount_unit: string;
  createdById: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { daily_purchase } from "@prisma/client";
import prisma from "../../../prisma/database";

const CreateMaterial = async (
  payload: CreateMaterialPayload
): Promise<ApiResponseType<daily_purchase | null>> => {
  const functionname: string = CreateMaterial.name;

  try {
    const isdata = await prisma.daily_purchase.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        status: "ACTIVE",
        is_dvat_30a: false,
        dvat04Id: payload.dvatid,
      },
    });

    if (isdata) {
      if (isdata.invoice_date.getMonth() != payload.invoice_date.getMonth()) {
        return createResponse({
          message: "Kindly convert pending invoice from daily sale to DVAT 30",
          functionname,
        });
      }
    }

    const daily_purchase_response = await prisma.daily_purchase.create({
      data: {
        dvat04Id: payload.dvatid,
        seller_tin_numberId: payload.seller_tin_id,
        invoice_number: payload.invoice_number,
        invoice_date: payload.invoice_date,
        commodity_masterId: payload.commodityid,
        quantity: payload.quantity,
        tax_percent: payload.tax_percent,
        amount: payload.amount,
        amount_unit: payload.amount_unit,
        vatamount: payload.vatamount,
        is_dvat_30a: false,
        createdById: payload.createdById,
        is_local: false,
      },
    });

    if (!daily_purchase_response) {
      return createResponse({
        message: "Something want wrong. Unable to add raw material.",
        functionname,
      });
    }

    return createResponse({
      message: "Stock Created successfully",
      functionname,
      data: daily_purchase_response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateMaterial;
