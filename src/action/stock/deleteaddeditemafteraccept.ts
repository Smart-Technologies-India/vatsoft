"use server";
import { getCurrentUserId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { daily_sale } from "@prisma/client";
import prisma from "../../../prisma/database";

interface DeleteAddedItemAfterAcceptPayload {
  dailySaleId: number;
  invoiceNumber: string;
  sellerId: number;
  dvatId: number;
}

const DeleteAddedItemAfterAccept = async (
  payload: DeleteAddedItemAfterAcceptPayload,
): Promise<ApiResponseType<daily_sale | null>> => {
  const functionname: string = DeleteAddedItemAfterAccept.name;

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
          id: payload.dailySaleId,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          is_paid: true,
        },
      });

      if (!saleItem) {
        throw new Error("Sale item not found or already deleted.");
      }

      // Get current wallet balance
      const dvat04 = await prisma.dvat04.findUnique({
        where: { id: payload.dvatId, deletedAt: null },
      });

      if (!dvat04) {
        throw new Error("DVAT04 record not found");
      }

      const oldWallet = parseFloat(dvat04.wallet || "0");
      const refundAmount = parseFloat(saleItem.vatamount.toString());
      const newWallet = oldWallet + refundAmount;

      // Update wallet
      await prisma.dvat04.update({
        where: { id: payload.dvatId, deletedAt: null },
        data: {
          wallet: newWallet.toFixed(2),
        },
      });

      // Create wallet history entry with -DELETE suffix
      const invoiceNumberForHistory = `${payload.invoiceNumber}-DELETE-${saleItem.commodity_masterId}`;
      await prisma.liquor_wallet_history.create({
        data: {
          dvatId: payload.dvatId,
          sellerId: payload.sellerId,
          type: "CREDIT",
          old_wallet: oldWallet.toFixed(2),
          new_wallet: newWallet.toFixed(2),
          invoice_number: invoiceNumberForHistory,
          status: "ACTIVE",
          amount: refundAmount.toFixed(2),
        },
      });

      await prisma.liquor_wallet_history.updateMany({
        where: {
          dvatId: payload.dvatId,
          sellerId: payload.sellerId,
          type: "DEBIT",
          invoice_number: payload.invoiceNumber,
          status: "ACTIVE",
          deletedAt: null,
        },
        data: {
          invoice_number: `${payload.invoiceNumber}-EDITED`
        },
      });

      // Return stock to stock table
      const stock = await prisma.stock.findFirst({
        where: {
          dvat04Id: payload.dvatId,
          commodity_masterId: saleItem.commodity_masterId,
          deletedAt: null,
          deletedById: null,
        },
      });

      if (stock) {
        await prisma.stock.update({
          where: { id: stock.id, deletedAt: null, deletedById: null },
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
              invoice_number: payload.invoiceNumber,
              invoice_date: saleItem.invoice_date,
              commodity_masterId: saleItem.commodity_masterId,
              urn_number: saleItem.urn_number,
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
      message: "Added item deleted successfully and wallet amount refunded.",
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

export default DeleteAddedItemAfterAccept;
