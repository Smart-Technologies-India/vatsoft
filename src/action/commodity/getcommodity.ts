"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface GetAllCommodityPayload {}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { commodity, user } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAllCommodity = async (
  payload: GetAllCommodityPayload
): Promise<ApiResponseType<commodity[] | null>> => {
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetAllCommodity",
      } as any;
    }

    const commodity = await prisma.commodity.findMany({
      where:{
        deletedAt: null,
        deletedBy: null,
      }
    });

    if (!commodity)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetAllCommodity",
      };

    return {
      status: true,
      data: commodity,
      message: "User data get successfully",
      functionname: "GetAllCommodity",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetAllCommodity",
    };
    return response;
  }
};

export default GetAllCommodity;
