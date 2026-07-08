"use server";

import { errorToString } from "@/utils/methods";
import { commodity_master } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId } from "@/lib/auth";
interface GetAllCommodityMasterPayload {
  take: number;
  skip: number;
  searchTerm?: string;
  productType?: string;
}

const GetAllCommodityMaster = async (
  payload: GetAllCommodityMasterPayload,
): Promise<PaginationResponse<commodity_master[] | null>> => {
  const functionname: string = GetAllCommodityMaster.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetAllCommodityMaster",
      } as any;
    }

    // Build the where clause with filters
    const whereClause: any = {
      deletedAt: null,
      deletedById: null,
    };

    // Add search filter if provided - search only in text fields
    if (payload.searchTerm && payload.searchTerm.trim().length > 0) {
      const searchTerm = payload.searchTerm.trim();
      whereClause.OR = [
        {
          product_name: {
            contains: searchTerm,
          },
        },
        {
          description: {
            contains: searchTerm,
          },
        },
        {
          id: parseInt(searchTerm),
        },
      ];
    }

    // Add product type filter if provided - but only if not searching
    // If searching, the OR clause will handle product type matching
    if (
      payload.productType &&
      payload.productType !== "all" &&
      (!payload.searchTerm || payload.searchTerm.trim().length === 0)
    ) {
      whereClause.product_type = {
        equals: payload.productType,
      };
    }

    const [results, totalCount] = await Promise.all([
      prisma.commodity_master.findMany({
        where: whereClause,
        take: payload.take,
        skip: payload.skip,
        orderBy: {
          product_name: "asc",
        },
      }),
      prisma.commodity_master.count({
        where: whereClause,
      }),
    ]);

    if (!results) {
      return createPaginationResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });
    }

    return createPaginationResponse({
      message: "All Commodity Data get successfully",
      functionname,
      data: results,
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
