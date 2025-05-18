"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { news } from "@prisma/client";
import prisma from "../../../prisma/database";

interface UpdateNewsPayload {
  id: number;
  updatedby: number;
  title: string;
  description: string;
  topic: string;
  postdate: Date;
}

const UpdateNews = async (
  payload: UpdateNewsPayload
): Promise<ApiResponseType<news | null>> => {
  const functionname: string = UpdateNews.name;

  try {
    const isnews = await prisma.news.findFirst({
      where: { id: payload.id, status: "ACTIVE" },
    });
    if (!isnews) {
      return createResponse({
        message: "Something went wrong unable to create news. Try again!",
        functionname,
      });
    }

    const newsdata = await prisma.news.update({
      where: {
        id: payload.id,
      },
      data: {
        updatedById: payload.updatedby,
        status: "ACTIVE",
        title: payload.title,
        descrilption: payload.description,
        postdate: payload.postdate,
        topic: payload.topic,
      },
    });

    return createResponse({
      message: newsdata ? "News updated successfully" : "Unable to udpate news.",
      functionname: functionname,
      data: newsdata ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default UpdateNews;
