"use server";
interface GetDvat04FromRegistrationPayload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetDvat04FromRegistration = async (
  payload: GetDvat04FromRegistrationPayload
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = GetDvat04FromRegistration.name;
  try {
    const dvat04response = await prisma.registration.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        id: payload.id,
      },
      include: {
        dvat04: {
          include: {
            selectComOne: true,
            selectComTwo: true,
            selectComThree: true,
            selectComFour: true,
            selectComFive: true,
          },
        },
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
      data: dvat04response.dvat04[0],
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetDvat04FromRegistration;
