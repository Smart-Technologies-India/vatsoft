"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface DeleteRefinerySalePayload {
  id: number;
}

const DeleteRefinerySale = async (
  payload: DeleteRefinerySalePayload,
): Promise<ApiResponseType<null>> => {
  const functionname = DeleteRefinerySale.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const currentDvat = await prisma.dvat04.findFirst({
      where: {
        id: currentDvatId,
        deletedAt: null,
      },
      select: {
        tin_master_id: true,
      },
    });

    if (!currentDvat) {
      return createResponse({
        message: "Current DVAT profile not found.",
        functionname,
      });
    }

    const refinerySale = await prisma.refinery_sale.findFirst({
      where: {
        id: payload.id,
        seller_tin_numberId: currentDvat.tin_master_id,
        refinery_status: "SALE",
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
    });

    if (!refinerySale) {
      return createResponse({
        message: "Refinery sale not found or cannot be deleted.",
        functionname,
      });
    }

    await prisma.refinery_sale.update({
      where: {
        id: payload.id,
      },
      data: {
        deletedAt: new Date(),
        deletedById: currentUserId,
      },
    });

    return createResponse({
      message: "Refinery sale deleted successfully.",
      functionname,
      data: null,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default DeleteRefinerySale;
