"use server";
interface GetUserDvat04Payload {}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetDvat04FromIdPayload {
  id: number;
}

const GetDvat04FromId = async (
  payload: GetDvat04FromIdPayload,
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = GetDvat04FromId.name;

  try {

    const dvat04response = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        id: payload.id,

        // createdById: payload.userid,
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

export default GetDvat04FromId;
