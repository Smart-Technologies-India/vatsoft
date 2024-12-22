"use server";
interface EditManufacturePayload {
  id: number;
  dvatid: number;
  commodityid: number;
  quantity: number;
  tax_percent: string;
  amount: string;
  vatamount: string;
  amount_unit: string;
  createdById: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { manufacturer_purchase, stock } from "@prisma/client";
import prisma from "../../../prisma/database";

const EditManufacture = async (
  payload: EditManufacturePayload
): Promise<ApiResponseType<manufacturer_purchase | null>> => {
  const functionname: string = EditManufacture.name;

  try {
    const result: manufacturer_purchase = await prisma.$transaction(
      async (prisma) => {
        const is_exist = await prisma.manufacturer_purchase.findFirst({
          where: {
            deletedAt: null,
            deletedBy: null,
            status: "ACTIVE",
            id: payload.id,
          },
        });

        if (!is_exist) {
          throw new Error("Unable to find manufacturer purchase Entry.");
        }

        const { id, createdById, ...filteredData } = is_exist;

        const create_response = await prisma.edit_manufacturer.create({
          data: {
            manufacturerId: is_exist.id,
            is_delete: false,
            createdById: payload.createdById,
            ...filteredData,
          },
        });

        if (!create_response) {
          throw new Error("Unable to edit manufacturer purchase Entry.");
        }

        const update_response = await prisma.manufacturer_purchase.update({
          where: { id: is_exist.id },
          data: {
            commodity_masterId: payload.commodityid,
            dvat04Id: payload.dvatid,
            quantity: payload.quantity,
            tax_percent: payload.tax_percent,
            amount_unit: payload.amount_unit,
            amount: payload.amount,
            vatamount: payload.vatamount,
            createdById: payload.createdById,
          },
        });

        if (!is_exist) {
          throw new Error("Unable to edit manufacturer purchase Entry.");
        }
        return update_response;
      }
    );
    return createResponse({
      message: "Manufacturer Purchase Entry Edit completed.",
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

export default EditManufacture;
