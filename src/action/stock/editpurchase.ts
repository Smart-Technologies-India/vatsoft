"use server";
interface EditPurchasePayload {
  id: number;
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

const EditPurchase = async (
  payload: EditPurchasePayload
): Promise<ApiResponseType<daily_purchase | null>> => {
  const functionname: string = EditPurchase.name;

  try {
    const result: daily_purchase = await prisma.$transaction(async (prisma) => {
      const is_exist = await prisma.daily_purchase.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          is_dvat_30a: false,
        },
      });

      if (!is_exist) {
        throw new Error("Unable to find purchase Entry.");
      }

      const { id, createdById, ...filteredData } = is_exist;

      const create_response = await prisma.edit_purchase.create({
        data: {
          purchaseId: is_exist.id,
          is_delete: false,
          createdById: payload.createdById,
          ...filteredData,
        },
      });

      if (!create_response) {
        throw new Error("Unable to edit purchase Entry.");
      }

      const update_response = await prisma.daily_purchase.update({
        where: { id: is_exist.id },
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
          updatedById: payload.createdById,
        },
      });

      if (!is_exist) {
        throw new Error("Unable to edit purchase Entry.");
      }

      return update_response;
    });

    return createResponse({
      message: "Purchase Entry Edit completed.",
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

export default EditPurchase;
