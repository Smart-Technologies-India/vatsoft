"use server";

import { errorToString } from "@/utils/methods";
import { commodity_master } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetAllCommodityMasterPayload {
  take: number;
  skip: number;
}

const GetAllCommodityMaster = async (
  payload: GetAllCommodityMasterPayload
): Promise<PaginationResponse<commodity_master[] | null>> => {
  const functionname: string = GetAllCommodityMaster.name;


  try {
    const [commodity_master, totalCount] = await Promise.all([
      prisma.commodity_master.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
        },
        take: payload.take,
        skip: payload.skip,
      }),
      prisma.commodity_master.count({
        where: {
          deletedAt: null,
          deletedById: null,
        },
      }),
    ]);


    if (!commodity_master) {
      return createPaginationResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });
    }

    return createPaginationResponse({
      message: "All Commodity Data get successfully",
      functionname,
      data: commodity_master,
      take: payload.take,
      skip: payload.skip,
      total: totalCount ?? 0,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAllCommodityMaster;
