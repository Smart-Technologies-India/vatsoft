"use server";

import { errorToString } from "@/utils/methods";
import {
  commodity_master,
  manufacturer_purchase,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";

interface GetByIdManufacturerPurchasePayload {
  id: number;
}

const GetByIdManufacturerPurchase = async (
  payload: GetByIdManufacturerPurchasePayload
): Promise<
  ApiResponseType<
    | (manufacturer_purchase & {
        commodity_master: commodity_master;
      })
    | null
  >
> => {
  const functionname: string = GetByIdManufacturerPurchase.name;

  try {
    const response = await prisma.manufacturer_purchase.findFirst({
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

    if (!response) {
      return createResponse({
        message: "No Manufacturer Purchase found. Please try again.",
        functionname,
      });
    }

    return createResponse({
      message: "All Manufacturer Purchase Data get successfully",
      functionname,
      data: response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetByIdManufacturerPurchase;
