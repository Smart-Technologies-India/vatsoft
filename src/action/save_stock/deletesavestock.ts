"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";

interface DeleteSaveStockPayload {
  id: number;
}

const DeleteSaveStock = async (
  payload: DeleteSaveStockPayload
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = DeleteSaveStock.name;

  try {
    const first_stock = await prisma.save_stock.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        id: payload.id,
      },
      include: {
        commodity_master: true,
      },
    });

    if (!first_stock) {
      return createResponse({
        message: "Stock not found",
        functionname,
        data: null,
      });
    }

    const deleted_stock = await prisma.save_stock.delete({
      where: {
        id: payload.id,
      },
    });
    if (!deleted_stock) {
      return createResponse({
        message: "Unable to delete stock",
        functionname,
        data: null,
      });
    }

    return createResponse({
      message: "Stock count successfully",
      functionname,
      data: true,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default DeleteSaveStock;
