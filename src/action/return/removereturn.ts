"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { returns_01, returns_entry } from "@prisma/client";

interface RemoveReturnPayload {
  id: number;
}

const RemoveReturn = async (
  payload: RemoveReturnPayload
): Promise<ApiResponseType<returns_entry | null>> => {
  const functionname: string = RemoveReturn.name;
  try {
    let isExist = await prisma.returns_entry.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
    });

    if (!isExist) {
      return createResponse({ message: "Invalid Id, try again", functionname });
    }
    const updateresponse = await prisma.returns_entry.update({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      data: {
        status: "INACTIVE",
      },
    });
    if (!updateresponse) {
      return createResponse({
        message: "Something went wrong! Unable to update",
        functionname,
      });
    }

    return createResponse({
      message: "Form submitted completed successfully.",
      functionname,
      data: updateresponse,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default RemoveReturn;
