"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master } from "@prisma/client";
import prisma from "../../../prisma/database";

interface CheckProductNameProps {
  product_name: string;
}

const CheckProductNameExists = async (
  payload: CheckProductNameProps
): Promise<ApiResponseType<commodity_master | null>> => {
  const functionname: string = CheckProductNameExists.name;

  try {
    const existingProduct = await prisma.commodity_master.findFirst({
      where: {
        product_name: payload.product_name,
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    return createResponse({
      message: existingProduct
        ? "Product name already exists"
        : "Product name is available",
      functionname,
      data: existingProduct,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CheckProductNameExists;
