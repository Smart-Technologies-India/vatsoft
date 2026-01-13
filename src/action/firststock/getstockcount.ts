"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { getCurrentDvatId } from "@/lib/auth";

interface StockCountPayload {}

const StockCount = async (
  payload: StockCountPayload
): Promise<ApiResponseType<number | null>> => {
  const functionname: string = StockCount.name;

  try {
    const dvatid = await getCurrentDvatId();

    if (dvatid == null || dvatid == undefined) {
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetDvat",
      };
    }

    const count = await prisma.stock.count({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        dvat04Id: dvatid,
      },
    });

    return createResponse({
      message: "Stock count successfully",
      functionname,
      data: count,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default StockCount;
