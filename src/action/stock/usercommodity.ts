"use server";
interface GetUserCommodityPayload {
  dvatid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master, stock } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetUserCommodity = async (
  payload: GetUserCommodityPayload
): Promise<ApiResponseType<commodity_master[] | null>> => {
  const functionname: string = GetUserCommodity.name;

  try {
    const stock_response: Array<
      stock & { commodity_master: commodity_master }
    > = await prisma.stock.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        dvat04Id: payload.dvatid,
        NOT: [
          {
            quantity: 0,
          },
        ],
      },
      include: {
        commodity_master: true,
      },
    });

    if (stock_response.length == 0) {
      return createResponse({
        message: "There is no stock for this user.",
        functionname,
      });
    }

    let comm_data: commodity_master[] = [];

    for (let i = 0; i < stock_response.length; i++) {
      comm_data.push(stock_response[i].commodity_master);
    }

    return createResponse({
      message: "User stock get successfully",
      functionname,
      data: comm_data,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetUserCommodity;
