"use server";
interface DeleteSalePayload {
  id: number;
  deletedById: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { daily_sale } from "@prisma/client";
import prisma from "../../../prisma/database";

const DeleteSale = async (
  payload: DeleteSalePayload
): Promise<ApiResponseType<daily_sale | null>> => {
  const functionname: string = DeleteSale.name;

  try {
    const result: daily_sale = await prisma.$transaction(async (prisma) => {
      // Find the sale entry with all necessary fields
      let is_exist = await prisma.daily_sale.findFirst({
        where: {
          id: payload.id,
        },
      });

      if (!is_exist) {
        throw new Error("Unable to find Sale Entry.");
      }

      // Return stock to stock table
      const stock = await prisma.stock.findFirst({
        where: {
          dvat04Id: is_exist.dvat04Id,
          commodity_masterId: is_exist.commodity_masterId,
        },
      });

      if (stock) {
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            quantity: stock.quantity + is_exist.quantity,
          },
        });
      }

      // Delete mirrored daily_purchase rows using reverse mapping:
      // sale(dvat04Id, seller_tin_numberId) -> purchase(seller_tin_numberId, dvat04Id)
      const sellerDvat = await prisma.dvat04.findFirst({
        where: {
          id: is_exist.dvat04Id,
          deletedAt: null,
          deletedBy: null,
        },
      });

      const buyerTinMaster = await prisma.tin_number_master.findFirst({
        where: {
          id: is_exist.seller_tin_numberId,
          deletedAt: null,
        },
      });

      if (sellerDvat?.tinNumber && buyerTinMaster?.tin_number) {
        const buyerDvat = await prisma.dvat04.findFirst({
          where: {
            tinNumber: buyerTinMaster.tin_number,
            deletedAt: null,
            deletedBy: null,
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
              invoice_number: is_exist.invoice_number,
              invoice_date: is_exist.invoice_date,
              deletedAt: null,
              status: "ACTIVE",
            },
            data: {
              status: "INACTIVE",
              updatedById: payload.deletedById,
              deletedAt: new Date(),
              deletedById: payload.deletedById,
            },
          });
        }
      }

      // Create audit entry for deletion
      const { id, createdById, ...filteredData } = is_exist;

      await prisma.edit_sale.create({
        data: {
          saleId: is_exist.id,
          is_delete: true,
          createdById: payload.deletedById,
          ...filteredData,
        },
      });

      // Also delete related credit/debit note rows in returns_entry,
      // where description_of_goods stores this sale URN.
      if (is_exist.urn_number) {
        await prisma.returns_entry.updateMany({
          where: {
            description_of_goods: is_exist.urn_number,
            deletedAt: null,
            status: "ACTIVE",
          },
          data: {
            updatedById: payload.deletedById,
            deletedById: payload.deletedById,
            deletedAt: new Date(),
            status: "INACTIVE",
          },
        });
      }

      // Soft delete the daily_sale entry
      const update_response = await prisma.daily_sale.update({
        where: { id: is_exist.id },
        data: {
          updatedById: payload.deletedById,
          deletedById: payload.deletedById,
          deletedAt: new Date(),
          status: "INACTIVE",
        },
      });

      return update_response;
    });
    return createResponse({
      message: "Sale Entry deleted and stock returned successfully.",
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

export default DeleteSale;
