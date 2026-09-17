"use server";

import { errorToString } from "@/utils/methods";
import { cform, dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

interface GetRefineryCformPayload {
  searchType?: "NONE" | "DVAT_TIN" | "DVAT_NAME";
  searchValue?: string;
  tin: string;
  take: number;
  skip: number;
}

const GetRefineryCform = async (
  payload: GetRefineryCformPayload,
): Promise<PaginationResponse<Array<cform & { dvat04: dvat04 }> | null>> => {
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

    // Build the where clause based on search criteria
    let whereClause: any = {
      deletedAt: null,
      deletedById: null,
      status: "ACTIVE",
      seller_tin_no: {
        contains: payload.tin,
      },
    };

    // Search by DVAT TIN number
    if (payload.searchType === "DVAT_TIN" && payload.searchValue) {
      whereClause.dvat04 = {
        tinNumber: {
          contains: payload.searchValue,
        },
      };
    }
    // Search by DVAT trade name
    else if (payload.searchType === "DVAT_NAME" && payload.searchValue) {
      whereClause.dvat04 = {
        tradename: {
          contains: payload.searchValue,
        },
      };
    }

    const [cform_data, totalCount] = await Promise.all([
      prisma.cform.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          dvat04: true,
        },
        take: payload.take,
        skip: payload.skip,
      }),
      prisma.cform.count({
        where: whereClause,
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
