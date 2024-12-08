"use server";
interface GetCommodityMasterPayload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetCommodityMaster = async (
  payload: GetCommodityMasterPayload
): Promise<ApiResponseType<commodity_master | null>> => {
  const functionname: string = GetCommodityMaster.name;

  try {
    const commodity_master = await prisma.commodity_master.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
    });

    if (!commodity_master) {
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });
    }

    return createResponse({
      message: "User data get successfully",
      functionname,
      data: commodity_master,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetCommodityMaster;
