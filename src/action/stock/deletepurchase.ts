"use server";
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
    const result: daily_purchase = await prisma.$transaction(async (prisma) => {
      let is_exist = await prisma.daily_purchase.findFirst({
        where: {
          id: payload.id,
        },
      });

      if (!is_exist) {
        throw new Error("Unable to find purchase Entry.");
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

      if (!is_exist) {
        throw new Error("Unable to delete purchase Entry.");
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

      if (!is_exist) {
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
