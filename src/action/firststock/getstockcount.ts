"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { cookies } from "next/headers";

interface StockCountPayload {}

const StockCount = async (
  payload: StockCountPayload
): Promise<ApiResponseType<number | null>> => {
  const functionname: string = StockCount.name;

  try {
    const dvatid = cookies().get("dvat")?.value;
    if (!dvatid) {
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
        dvat04Id: parseInt(dvatid),
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
