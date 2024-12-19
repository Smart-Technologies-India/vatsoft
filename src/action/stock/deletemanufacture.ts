"use server";
interface DeletePurchasePayload {
  id: number;
  deletedById: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { manufacturer_purchase } from "@prisma/client";
import prisma from "../../../prisma/database";

const DeleteManufacture = async (
  payload: DeletePurchasePayload
): Promise<ApiResponseType<manufacturer_purchase | null>> => {
  const functionname: string = DeleteManufacture.name;

  try {
    const result: manufacturer_purchase = await prisma.$transaction(
      async (prisma) => {
        console.log(payload.id);
        let is_exist = await prisma.manufacturer_purchase.findFirst({
          where: {
            id: payload.id,
          },
        });

        if (!is_exist) {
          throw new Error("Unable to find manufacture Entry.");
        }

        const { id, createdById, ...filteredData } = is_exist;

        const create_response = await prisma.edit_manufacturer.create({
          data: {
            manufacturerId: is_exist.id,
            is_delete: true,
            createdById: payload.deletedById,
            ...filteredData,
          },
        });

        if (!is_exist) {
          throw new Error("Unable to delete manufacture Entry.");
        }

        const update_response = await prisma.manufacturer_purchase.update({
          where: { id: is_exist.id },
          data: {
            updatedById: payload.deletedById,
            deletedById: payload.deletedById,
            deletedAt: new Date(),
            status: "INACTIVE",
          },
        });

        if (!is_exist) {
          throw new Error("Unable to delete manufacture Entry.");
        }

        return update_response;
      }
    );
    return createResponse({
      message: "Manufacture Entry deleted.",
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

export default DeleteManufacture;
