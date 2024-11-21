"use server";

import { errorToString } from "@/utils/methods";
import { news } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";

interface GetNewsPayload {
  id: number;
}

const GetNews = async (
  payload: GetNewsPayload
): Promise<ApiResponseType<news | null>> => {
  const functionname: string = GetNews.name;

  try {
    const news = await prisma.news.findFirst({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
    });

    return createResponse({
      message: news ? "News Get successfully" : "Unable to get news.",
      functionname: functionname,
      data: news ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetNews;
