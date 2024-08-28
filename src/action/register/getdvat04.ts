"use server";
interface GetDvat04Payload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04, registration } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetDvat04 = async (
  payload: GetDvat04Payload
): Promise<
  ApiResponseType<(dvat04 & { registration: registration[] }) | null>
> => {
  const functionname: string = GetDvat04.name;
  try {
    const dvat04response = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        id: payload.id,
      },
      include: {
        registration: true,
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

export default GetDvat04;
