"use server";

import { errorToString } from "@/utils/methods";
import { cform } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

interface GetRefineryCformPayload {
  tin: string;
  take: number;
  skip: number;
}

const GetRefineryCform = async (
  payload: GetRefineryCformPayload,
): Promise<PaginationResponse<Array<cform> | null>> => {
  const functionname: string = GetRefineryCform.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetRefineryCform",
      } as any;
    }

    const [cform_data, totalCount] = await Promise.all([
      prisma.cform.findMany({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          seller_tin_no: {
            contains: payload.tin,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: payload.take,
        skip: payload.skip,
      }),
      prisma.cform.count({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          seller_tin_no: {
            contains: payload.tin,
          },
        },
      }),
    ]);

    return createPaginationResponse({
      data: cform_data,
      skip: payload.skip,
      take: payload.take,
      total: totalCount,
      message: "C-Forms retrieved successfully",
      functionname: functionname,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname: functionname,
    });
  }
};

export default GetRefineryCform;
