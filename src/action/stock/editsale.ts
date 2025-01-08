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

  console.log(payload);

  try {
    const result: daily_sale = await prisma.$transaction(async (prisma) => {
      // Validate seller TIN number
      const sellerTin = await prisma.tin_number_master.findFirst({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          id: payload.seller_tin_id,
        },
      });

      if (!sellerTin) {
        throw new Error("Seller TIN number not found.");
      }

      // Validate existing sale entry
      const existingSale = await prisma.daily_sale.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          is_dvat_31: false,
        },
      });

      if (!existingSale) {
        throw new Error("Unable to find sale entry.");
      }

      // Create a backup of the existing sale entry
      const { id, createdById, ...backupData } = existingSale;

      const backupEntry = await prisma.edit_sale.create({
        data: {
          saleId: existingSale.id,
          is_delete: false,
          createdById: payload.createdById,
          ...backupData,
        },
      });

      if (!backupEntry) {
        throw new Error("Unable to create backup of sale entry.");
      }

      // Update the sale entry with new data
      const updatedSale = await prisma.daily_sale.update({
        where: { id: existingSale.id },
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
            sellerTin.tin_number.startsWith("25") ||
            sellerTin.tin_number.startsWith("26"),
        },
      });

      if (!updatedSale) {
        throw new Error("Unable to update sale entry.");
      }

      const purchase_update = await prisma.daily_purchase.updateMany({
        where: {
          urn_number: updatedSale.urn_number,
        },
        data: {
          invoice_number: payload.invoice_number,
          invoice_date: payload.invoice_date,
          quantity: payload.quantity,
          vatamount: payload.vatamount,
          amount_unit: payload.amount_unit,
          amount: payload.amount,
        },
      });

      if (!purchase_update) {
        throw new Error("Unable to update purchase entry.");
      }

      // Validate stock entry
      const stockEntry = await prisma.stock.findFirst({
        where: {
          commodity_masterId: payload.commodityid,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
        },
      });

      if (!stockEntry) {
        throw new Error("Stock not found.");
      }

      console.log(existingSale.quantity);
      console.log(stockEntry.quantity);
      console.log(payload.quantity);

      // Calculate the new stock quantity
      const stockAdjustment = payload.quantity - existingSale.quantity;
      const newStockQuantity = stockEntry.quantity - stockAdjustment;

      if (newStockQuantity < 0) {
        throw new Error("Stock not available.");
      }

      // Update or delete the stock entry based on the new quantity
      if (newStockQuantity === 0) {
        await prisma.stock.update({
          where: { id: stockEntry.id },
          data: {
            status: "INACTIVE",
            updatedById: payload.createdById,
            deletedAt: new Date(),
            deletedById: payload.createdById,
          },
        });
      } else {
        await prisma.stock.update({
          where: { id: stockEntry.id },
          data: {
            quantity: newStockQuantity,
            updatedById: payload.createdById,
          },
        });
      }

      return updatedSale;
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
