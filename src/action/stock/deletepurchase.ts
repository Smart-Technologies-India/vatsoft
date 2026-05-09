"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface DeletePurchasePayload {
  id: number;
  deletedById: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { daily_purchase } from "@prisma/client";
import prisma from "../../../prisma/database";

const DeletePurchase = async (
  payload: DeletePurchasePayload
): Promise<ApiResponseType<daily_purchase | null>> => {
  const functionname: string = DeletePurchase.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "DeletePurchase",
      } as any;
    }

    const result: daily_purchase = await prisma.$transaction(async (prisma) => {
      let is_exist = await prisma.daily_purchase.findFirst({
        where: {
          id: payload.id,
        },
      });

      if (!is_exist) {
        throw new Error("Unable to find purchase Entry.");
      }

      const find_stock = await prisma.stock.findFirst({
        where: {
          commodity_masterId: is_exist.commodity_masterId,
          status: "ACTIVE",
          dvat04Id: is_exist.dvat04Id,
        },
      });

      if (!find_stock) {
        throw new Error("Unable to find stock Entry.");
      }

      if (find_stock.quantity < is_exist.quantity) {
        throw new Error(
          "Unable to delete purchase Entry. Stock quantity is less than purchase quantity."
        );
      }

      const { id, createdById, ...filteredData } = is_exist;

      const create_response = await prisma.edit_purchase.create({
        data: {
          purchaseId: is_exist.id,
          is_delete: true,
          createdById: payload.deletedById,
          ...filteredData,
        },
      });

      if (!create_response) {
        throw new Error("Unable to delete purchase Entry.");
      }

      // Also delete related debit/credit note rows in returns_entry,
      // where description_of_goods stores this purchase URN.
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

      const update_response = await prisma.daily_purchase.update({
        where: { id: is_exist.id },
        data: {
          updatedById: payload.deletedById,
          deletedById: payload.deletedById,
          deletedAt: new Date(),
          status: "INACTIVE",
        },
      });

      if (!update_response) {
        throw new Error("Unable to delete purchase Entry.");
      }

      return update_response;
    });
    return createResponse({
      message: "Purchase Entry deleted.",
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

export default DeletePurchase;
