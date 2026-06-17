"use server";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { daily_purchase } from "@prisma/client";
import prisma from "../../../prisma/database";

interface RejectPurchasePayload {
  id: number;
}

const RejectPurchase = async (
  payload: RejectPurchasePayload,
): Promise<ApiResponseType<daily_purchase | null>> => {
  const functionname: string = RejectPurchase.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "RejectPurchase",
      } as any;
    }

    const purchaseEntry = await prisma.daily_purchase.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      include: {
        seller_tin_number: true,
      },
    });

    if (!purchaseEntry) {
      return createResponse({
        message: "Unable to find purchase entry.",
        functionname,
      });
    }

    const isAcceptRejectEligible =
      purchaseEntry.seller_tin_number.tin_number.startsWith("25") ||
      purchaseEntry.seller_tin_number.tin_number.startsWith("26");

    if (!isAcceptRejectEligible) {
      return createResponse({
        message: "Reject action is only allowed for local purchase entries.",
        functionname,
      });
    }

    if (purchaseEntry.is_accept) {
      return createResponse({
        message: "Accepted purchase entries cannot be rejected.",
        functionname,
      });
    }

    const rejectedPurchase = await prisma.$transaction(async (tx) => {
      const purchase = await tx.daily_purchase.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
        },
      });

      if (!purchase) {
        throw new Error("Unable to find purchase entry.");
      }

      const linkedSale = purchase.urn_number
        ? await tx.daily_sale.findFirst({
            where: {
              urn_number: purchase.urn_number,
              deletedAt: null,
              deletedById: null,
              status: "ACTIVE",
            },
          })
        : null;

      if (linkedSale) {
        const sellerStock = await tx.stock.findFirst({
          where: {
            dvat04Id: linkedSale.dvat04Id,
            commodity_masterId: linkedSale.commodity_masterId,
            deletedAt: null,
            deletedById: null,
            status: "ACTIVE",
          },
        });

        if (sellerStock) {
          await tx.stock.update({
            where: { id: sellerStock.id },
            data: {
              quantity: sellerStock.quantity + linkedSale.quantity,
              updatedById: currentUserId,
            },
          });
        } else {
          await tx.stock.create({
            data: {
              dvat04Id: linkedSale.dvat04Id,
              commodity_masterId: linkedSale.commodity_masterId,
              quantity: linkedSale.quantity,
              createdById: currentUserId,
              status: "ACTIVE",
            },
          });
        }

        const { id: saleId, createdById: saleCreatedById, ...saleAuditData } =
          linkedSale;
        await tx.edit_sale.create({
          data: {
            saleId,
            is_delete: true,
            createdById: currentUserId,
            ...saleAuditData,
          },
        });

        if (linkedSale.urn_number) {
          await tx.returns_entry.updateMany({
            where: {
              description_of_goods: linkedSale.urn_number,
              deletedAt: null,
              status: "ACTIVE",
            },
            data: {
              updatedById: currentUserId,
              deletedById: currentUserId,
              deletedAt: new Date(),
              status: "INACTIVE",
            },
          });
        }

        await tx.daily_sale.update({
          where: { id: linkedSale.id },
          data: {
            updatedById: currentUserId,
            deletedById: currentUserId,
            deletedAt: new Date(),
            status: "INACTIVE",
          },
        });
      }

      const {
        id: purchaseId,
        createdById: purchaseCreatedById,
        ...purchaseAuditData
      } = purchase;

      await tx.edit_purchase.create({
        data: {
          purchaseId,
          is_delete: true,
          createdById: currentUserId,
          ...purchaseAuditData,
        },
      });

      if (purchase.urn_number) {
        await tx.returns_entry.updateMany({
          where: {
            description_of_goods: purchase.urn_number,
            deletedAt: null,
            status: "ACTIVE",
          },
          data: {
            updatedById: currentUserId,
            deletedById: currentUserId,
            deletedAt: new Date(),
            status: "INACTIVE",
          },
        });
      }

      return tx.daily_purchase.update({
        where: { id: purchase.id },
        data: {
          updatedById: currentUserId,
          deletedById: currentUserId,
          deletedAt: new Date(),
          status: "INACTIVE",
        },
      });
    });

    return createResponse({
      message: "Purchase entry rejected successfully.",
      functionname,
      data: rejectedPurchase,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default RejectPurchase;
