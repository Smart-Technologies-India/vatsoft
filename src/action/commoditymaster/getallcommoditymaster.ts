"use server";
interface GetAllCommodityMasterPayload {}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAllCommodityMaster = async (
  payload: GetAllCommodityMasterPayload
): Promise<ApiResponseType<commodity_master[] | null>> => {
  const functionname: string = GetAllCommodityMaster.name;

  try {
    const commodity_master = await prisma.commodity_master.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
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

export default GetAllCommodityMaster;
