"use server";
interface GetReturn01Payload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { returns_01, dvat04, registration } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetReturn01 = async (
  payload: GetReturn01Payload
): Promise<
  ApiResponseType<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } }) | null
  >
> => {
  const functionname: string = GetReturn01.name;
  try {
    const return01response = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        id: payload.id,
      },
      include: {
        dvat04: {
          include: {
            registration: true,
          },
        },
        returns_entry: true,
      },
    });

    if (!return01response)
      return createResponse({
        message: "Invalid return id. Please try again.",
        functionname,
      });

    return createResponse({
      message: "Return data get successfully",
      functionname,
      data: return01response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetReturn01;
