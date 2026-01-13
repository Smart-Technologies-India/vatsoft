"use server";
interface GetUserDvat04AnxPayload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";
import { getCurrentDvatId } from "@/lib/auth";

const GetUserDvat04Anx = async (
  payload: GetUserDvat04AnxPayload
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = GetUserDvat04Anx.name;

  const dvatid = await getCurrentDvatId();

  if (dvatid == null || dvatid == undefined) {
    return createResponse({
      message: "Invalid id. Please try again.",
      functionname,
    });
  }

  try {
    const dvat04response = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        id: dvatid,
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

export default GetUserDvat04Anx;
