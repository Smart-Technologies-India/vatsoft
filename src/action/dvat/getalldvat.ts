"use server";
interface GetUserDvat04Payload {}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAllDvat04 = async (
  payload: GetUserDvat04Payload
): Promise<ApiResponseType<dvat04[] | null>> => {
  const functionname: string = GetAllDvat04.name;

  try {
    const dvat04response = await prisma.dvat04.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        status: "APPROVED",
      },
    });

    if (!dvat04response)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    return createResponse({
      message: "dvat04 data get successfully",
      functionname,
      data: dvat04response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAllDvat04;
