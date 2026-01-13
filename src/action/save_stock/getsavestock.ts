"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master, first_stock } from "@prisma/client";
import { getCurrentDvatId } from "@/lib/auth";

interface GetSaveStockPayload {}

const GetSaveStock = async (
  payload: GetSaveStockPayload
): Promise<
  ApiResponseType<Array<
    first_stock & { commodity_master: commodity_master }
  > | null>
> => {
  const functionname: string = GetSaveStock.name;

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

    const first_stock = await prisma.save_stock.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        dvat04Id: dvatid,
      },
      include: {
        commodity_master: true,
      },
    });

    return createResponse({
      message: "Stock count successfully",
      functionname,
      data: first_stock,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetSaveStock;
