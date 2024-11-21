"use server";

import { errorToString } from "@/utils/methods";
import { news } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetAllNewsPayload {
  skip: number;
  take: number;
}

const GetAllNews = async (
  payload: GetAllNewsPayload
): Promise<PaginationResponse<news[] | null>> => {
  const functionname: string = GetAllNews.name;

  try {
    const [news, totalCount] = await Promise.all([
      prisma.news.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.news.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
      }),
    ]);

    return createPaginationResponse({
      message: news ? "News Get successfully" : "Unable to get news.",
      functionname: functionname,
      data: news ?? null,
      skip: payload.skip,
      take: payload.take,
      total: totalCount,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAllNews;
