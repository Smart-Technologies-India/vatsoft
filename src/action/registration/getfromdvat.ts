"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { dvat04, registration, returns_01 } from "@prisma/client";

interface GetFromDvatPayload {
  id: number;
}

const GetFromDvat = async (
  payload: GetFromDvatPayload
): Promise<ApiResponseType<(registration & { dvat04: dvat04 }) | null>> => {
  const functionname: string = GetFromDvat.name;
  try {
    const is_exist = await prisma.registration.findFirst({
      where: {
        dvat04Id: parseInt(payload.id.toString() ?? "0"),
        deletedAt: null,
        deletedById: null,
      },
      include: {
        dvat04: true,
      },
    });

    if (!is_exist) {
      return createResponse({ message: "Invalid Id, try again", functionname });
    }

    return createResponse({
      message: "Registration get successfully.",
      functionname,
      data: is_exist,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetFromDvat;
