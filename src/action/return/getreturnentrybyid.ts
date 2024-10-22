"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { returns_entry, tin_number_master } from "@prisma/client";

interface getReturnEntryByIdPayload {
  id: number;
}

const getReturnEntryById = async (
  payload: getReturnEntryByIdPayload
): Promise<
  ApiResponseType<
    (returns_entry & { seller_tin_number: tin_number_master }) | null
  >
> => {
  const functionname: string = getReturnEntryById.name;

  try {
    const returnforms = await prisma.returns_entry.findFirst({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
      include: {
        seller_tin_number: true,
        state: true,
      },
    });

    if (!returnforms) {
      return createResponse({
        message: "Unable to get return froms. Please try again.",
        functionname,
      });
    }

    return createResponse({
      functionname,
      message: "Returns forms data get successfully",
      data: returnforms,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default getReturnEntryById;
