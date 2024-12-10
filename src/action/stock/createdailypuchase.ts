"use server";
interface CreateDailyPurchasePayload {
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
import { stock } from "@prisma/client";
import prisma from "../../../prisma/database";

const CreateDailyPurchase = async (
  payload: CreateDailyPurchasePayload
): Promise<ApiResponseType<stock | null>> => {
  const functionname: string = CreateDailyPurchase.name;

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

    const commodity_master = await prisma.daily_purchase.create({
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

    if (!commodity_master) {
      return createResponse({
        message: "Something want wrong. Unable to create daily purchase.",
        functionname,
      });
    }

    const isstock = await prisma.stock.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        status: "ACTIVE",
        dvat04Id: payload.dvatid,
        commodity_masterId: payload.commodityid,
      },
    });

    if (isstock) {
      const stock_respone = await prisma.stock.update({
        where: {
          id: isstock.id,
        },
        data: {
          quantity: payload.quantity + isstock.quantity,
          updatedById: payload.createdById,
        },
      });
      if (!stock_respone) {
        return createResponse({
          message: "Unable to update stock.",
          functionname,
        });
      }
      return createResponse({
        message: "Stock Updated successfully",
        functionname,
        data: stock_respone,
      });
    } else {
      const stock_respone = await prisma.stock.create({
        data: {
          quantity: payload.quantity,
          commodity_masterId: payload.commodityid,
          dvat04Id: payload.dvatid,
          createdById: payload.createdById,
          status: "ACTIVE",
        },
      });

      if (!stock_respone) {
        return createResponse({
          message: "Unable to create new stock.",
          functionname,
        });
      }
      return createResponse({
        message: "Stock Created successfully",
        functionname,
        data: stock_respone,
      });
    }
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateDailyPurchase;
