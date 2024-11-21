"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { news } from "@prisma/client";
import prisma from "../../../prisma/database";

interface CreateNewsPayload {
  createdby: number;
  title: string;
  description: string;
  topic: string;
  postdate: Date;
}

const CreateNews = async (
  payload: CreateNewsPayload
): Promise<ApiResponseType<news | null>> => {
  const functionname: string = CreateNews.name;

  try {
    const newsdata = await prisma.news.create({
      data: {
        createdById: payload.createdby,
        status: "ACTIVE",
        title: payload.title,
        descrilption: payload.description,
        postdate: payload.postdate,
        topic: payload.topic,
      },
    });

    return createResponse({
      message: newsdata ? "News create successfully" : "Unable to news.",
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

export default CreateNews;
