"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master, first_stock } from "@prisma/client";

const GetNilCommodity = async (): Promise<
  ApiResponseType<commodity_master | null>
> => {
  const functionname: string = GetNilCommodity.name;

  try {
    const commodity_data = await prisma.commodity_master.findFirst({
      where: {
        // id: 1154,
        id: 748,
      },
    });

    if (!commodity_data) {
      return createResponse({
        message: "Commodity not found",
        functionname,
        data: null,
      });
    }

    return createResponse({
      message: "Stock count successfully",
      functionname,
      data: commodity_data,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetNilCommodity;
