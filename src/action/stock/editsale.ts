"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
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
  against_cfrom?: boolean;
  is_against_fform?: boolean;
  is_against_iform?: boolean;
  is_export?: boolean;
  is_h_export?: boolean;
  is_against_e1?: boolean;
  is_exempt?: boolean;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { daily_sale } from "@prisma/client";
import prisma from "../../../prisma/database";

const EditSale = async (
  payload: EditSalePayload,
): Promise<ApiResponseType<daily_sale | null>> => {
  const functionname: string = EditSale.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "EditSale",
      } as any;
    }

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
          is_against_cform: payload.against_cfrom ?? false,
          is_against_fform: payload.is_against_fform ?? false,
          is_exempt: payload.is_exempt ?? false,
          is_against_iform: payload.is_against_iform ?? false,
          is_h_export: payload.is_h_export ?? false,
          is_against_e1: payload.is_against_e1 ?? false,
          is_export: payload.is_export ?? false,
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

      // Keep mirrored purchase entry in sync using the shared URN number.
      if (updatedSale.urn_number) {
        const isLocalSale =
          sellerTin.tin_number.startsWith("25") ||
          sellerTin.tin_number.startsWith("26");

        const linkedPurchases = await prisma.daily_purchase.findMany({
          where: {
            urn_number: updatedSale.urn_number,
            deletedAt: null,
            deletedBy: null,
            status: "ACTIVE",
          },
        });

        if (linkedPurchases.length > 0) {
          const backupPurchases = linkedPurchases.map((purchase) => {
            const { id, createdById, ...backupData } = purchase;
            return {
              purchaseId: purchase.id,
              is_delete: false,
              createdById: payload.createdById,
              ...backupData,
            };
          });

          await prisma.edit_purchase.createMany({
            data: backupPurchases,
          });
        }

        const purchaseUpdate = await prisma.daily_purchase.updateMany({
          where: {
            urn_number: updatedSale.urn_number,
            deletedAt: null,
            deletedById: null,
            status: "ACTIVE",
          },
          data: {
            invoice_number: payload.invoice_number,
            invoice_date: payload.invoice_date,
            commodity_masterId: payload.commodityid,
            quantity: payload.quantity,
            tax_percent: payload.tax_percent,
            amount: payload.amount,
            amount_unit: payload.amount_unit,
            vatamount: payload.vatamount,
            is_against_cform: payload.against_cfrom ?? false,
            is_against_fform: payload.is_against_fform ?? false,
            is_against_iform: payload.is_against_iform ?? false,
            is_export: payload.is_export ?? false,
            is_against_e1form: payload.is_against_e1 ?? false,
            updatedById: payload.createdById,
          },
        });

        if (isLocalSale && purchaseUpdate.count === 0) {
          throw new Error("Linked purchase entry not found for this sale URN.");
        }
      }

      // Recalculate stock only when quantity has actually changed.
      if (payload.quantity !== existingSale.quantity) {
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

        // For sale edit, increasing sale quantity reduces stock and vice versa.
        const stockAdjustment = payload.quantity - existingSale.quantity;
        const newStockQuantity = stockEntry.quantity - stockAdjustment;

        if (newStockQuantity < 0) {
          throw new Error("Stock not available.");
        }

        if (newStockQuantity === 0) {
          await prisma.stock.update({
            where: { id: stockEntry.id },
            data: {
              status: "INACTIVE",
              updatedById: payload.createdById,
              deletedAt: new Date(),
              quantity: 0,
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
