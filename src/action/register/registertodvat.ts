"use server";
interface RegisterToDvatPayload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

const RegisterToDvat = async (
  payload: RegisterToDvatPayload
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = RegisterToDvat.name;
  try {
    const registerresponse = await prisma.registration.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        id: payload.id,
      },
      include: {
        dvat04: true,
      },
    });

    if (!registerresponse)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    return createResponse({
      message: "dvat04 data get successfully",
      functionname,
      data: registerresponse.dvat04[0],
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default RegisterToDvat;
