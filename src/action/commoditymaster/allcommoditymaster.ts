"use server";
import { getCurrentUserId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { commodity_master } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";

interface AllCommodityMasterPayload {}

const AllCommodityMaster = async (
  payload: AllCommodityMasterPayload
): Promise<ApiResponseType<commodity_master[] | null>> => {
  const functionname: string = AllCommodityMaster.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AllCommodityMaster",
      } as any;
    }

    const commodity_master = await prisma.commodity_master.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
    });

    if (!commodity_master) {
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });
    }

    return createResponse({
      message: "All Commodity Data get successfully",
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

export default AllCommodityMaster;
