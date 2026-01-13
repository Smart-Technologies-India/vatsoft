"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface CheckFirstStockPayload {
  dvatid: number;
}

const CheckFirstStock = async (
  payload: CheckFirstStockPayload
): Promise<ApiResponseType<boolean>> => {
  const functionname: string = CheckFirstStock.name;

  try {
    const count = await prisma.first_stock.count({
      where: {
        dvat04Id: payload.dvatid,
        deletedAt: null,
      },
    });

    return createResponse({
      message: "First stock check completed successfully",
      functionname,
      data: count > 0,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
      data: false,
    });
  }
};

export default CheckFirstStock;
