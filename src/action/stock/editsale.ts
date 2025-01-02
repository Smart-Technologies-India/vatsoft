"use server";
interface EditSalePayload {
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
import { daily_sale } from "@prisma/client";
import prisma from "../../../prisma/database";

const EditSale = async (
  payload: EditSalePayload
): Promise<ApiResponseType<daily_sale | null>> => {
  const functionname: string = EditSale.name;

  try {
    const result: daily_sale = await prisma.$transaction(async (prisma) => {
      const purchaser_response = await prisma.tin_number_master.findFirst({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          id: payload.seller_tin_id,
        },
      });

      if (!purchaser_response) {
        throw new Error("Seller tin number not found.");
      }

      const is_exist = await prisma.daily_sale.findFirst({
        where: {
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          is_dvat_31: false,
          id: payload.id,
        },
      });

      if (!is_exist) {
        throw new Error("Unable to find sale Entry.");
      }

      const { id, createdById, ...filteredData } = is_exist;

      const create_response = await prisma.edit_sale.create({
        data: {
          saleId: is_exist.id,
          is_delete: false,
          createdById: payload.createdById,
          ...filteredData,
        },
      });

      if (!create_response) {
        throw new Error("Unable to edit sale Entry.");
      }

      const update_response = await prisma.daily_sale.update({
        where: { id: is_exist.id },
        data: {
          seller_tin_numberId: payload.seller_tin_id,
          amount_unit: payload.amount_unit,
          dvat04Id: payload.dvatid,
          invoice_number: payload.invoice_number,
          invoice_date: payload.invoice_date,
          commodity_masterId: payload.commodityid,
          quantity: payload.quantity,
          tax_percent: payload.tax_percent,
          amount: payload.amount,
          vatamount: payload.vatamount,
          is_dvat_31: false,
          createdById: payload.createdById,
          is_local:
            purchaser_response.tin_number.startsWith("25") ||
            purchaser_response.tin_number.startsWith("26"),
        },
      });

      if (!update_response) {
        throw new Error("Unable to edit sale Entry.");
      }


      const find_stock = await prisma.stock.findFirst({
        where: {
          commodity_masterId: payload.commodityid,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
        },
      });

      if (!find_stock) {
        throw new Error("Stock not found.");
      }

      // const difference = payload.quantity - find_stock.quantity;

      const stock_response = await prisma.stock.update({
        where: {
          id: find_stock.id,
        },
        data: {
          quantity: payload.quantity,
        },
      });

      if (!stock_response) {
        throw new Error("Unable to update stock.");
      }

      return update_response;
    });

    return createResponse({
      message: "Daily Sale Edit Completed",
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

export default EditSale;
