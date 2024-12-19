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
      let is_exist = await prisma.daily_sale.findFirst({
        where: {
          id: payload.id,
        },
      });

      if (!is_exist) {
        throw new Error("Unable to find Sale Entry.");
      }

      const { id, createdById, ...filteredData } = is_exist;

      const create_response = await prisma.edit_sale.create({
        data: {
          saleId: is_exist.id,
          is_delete: true,
          createdById: payload.deletedById,
          ...filteredData,
        },
      });

      if (!is_exist) {
        throw new Error("Unable to delete Sale Entry.");
      }

      const update_response = await prisma.daily_sale.update({
        where: { id: is_exist.id },
        data: {
          updatedById: payload.deletedById,
          deletedById: payload.deletedById,
          deletedAt: new Date(),
          status: "INACTIVE",
        },
      });

      if (!is_exist) {
        throw new Error("Unable to delete Sale Entry.");
      }

      return update_response;
    });
    return createResponse({
      message: "Sale Entry deleted.",
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
