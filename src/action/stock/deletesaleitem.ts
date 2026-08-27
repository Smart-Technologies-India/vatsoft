"use server";
import { getCurrentUserId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { daily_sale } from "@prisma/client";
import prisma from "../../../prisma/database";

interface DeleteSaleItemPayload {
  id: number;
}

const DeleteSaleItem = async (
  payload: DeleteSaleItemPayload,
): Promise<ApiResponseType<daily_sale | null>> => {
  const functionname: string = DeleteSaleItem.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const result: daily_sale = await prisma.$transaction(async (prisma) => {
      // Find the sale entry
      const saleItem = await prisma.daily_sale.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
        },
      });

      if (!saleItem) {
        throw new Error("Sale item not found or already deleted.");
      }

      // Check if item is already accepted
      if (saleItem.is_accept) {
        throw new Error("Cannot delete accepted sale items.");
      }

      // Return stock to stock table
      const stock = await prisma.stock.findFirst({
        where: {
          dvat04Id: saleItem.dvat04Id,
          commodity_masterId: saleItem.commodity_masterId,
          deletedAt: null,
          deletedById: null,
        },
      });

      if (stock) {
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            quantity: stock.quantity + saleItem.quantity,
          },
        });
      }

      // Delete mirrored daily_purchase row using reverse mapping:
      // sale(dvat04Id, seller_tin_numberId) -> purchase(seller_tin_numberId, dvat04Id)
      const sellerDvat = await prisma.dvat04.findFirst({
        where: {
          id: saleItem.dvat04Id,
          deletedAt: null,
          deletedById: null,
        },
      });

      const buyerTinMaster = await prisma.tin_number_master.findFirst({
        where: {
          id: saleItem.seller_tin_numberId,
          deletedAt: null,
        },
      });

      if (sellerDvat?.tinNumber && buyerTinMaster?.tin_number) {
        const buyerDvat = await prisma.dvat04.findFirst({
          where: {
            tinNumber: buyerTinMaster.tin_number,
            deletedAt: null,
            deletedById: null,
          },
        });

        const sellerTinMaster = await prisma.tin_number_master.findFirst({
          where: {
            tin_number: sellerDvat.tinNumber,
            status: "ACTIVE",
            deletedAt: null,
          },
        });

        if (buyerDvat && sellerTinMaster) {
          await prisma.daily_purchase.updateMany({
            where: {
              dvat04Id: buyerDvat.id,
              seller_tin_numberId: sellerTinMaster.id,
              invoice_number: saleItem.invoice_number,
              invoice_date: saleItem.invoice_date,
              commodity_masterId: saleItem.commodity_masterId,
              deletedAt: null,
              status: "ACTIVE",
            },
            data: {
              status: "INACTIVE",
              updatedById: currentUserId,
              deletedAt: new Date(),
              deletedById: currentUserId,
            },
          });
        }
      }

      // Create audit entry for deletion
      const { id, createdById, ...filteredData } = saleItem;

      await prisma.edit_sale.create({
        data: {
          saleId: saleItem.id,
          is_delete: true,
          createdById: currentUserId,
          ...filteredData,
        },
      });

      // Soft delete the daily_sale entry
      const updatedSale = await prisma.daily_sale.update({
        where: { id: saleItem.id },
        data: {
          updatedById: currentUserId,
          deletedById: currentUserId,
          deletedAt: new Date(),
          status: "INACTIVE",
        },
      });

      return updatedSale;
    });

    return createResponse({
      message: "Sale item deleted and stock reversed successfully.",
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

export default DeleteSaleItem;
