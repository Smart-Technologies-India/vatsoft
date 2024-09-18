"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface IsUserCompositionPayload {
  userid: number;
  compositionScheme: boolean;
}

const IsUserComposition = async (
  payload: IsUserCompositionPayload
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = IsUserComposition.name;

  try {
    const composition_response = await prisma.composition.findFirst({
      where: {
        compositionScheme: payload.compositionScheme,
        status: "PENDING",
        createdById: payload.userid,
        deletedById: null,
        deletedBy: null,
      },
    });

    return createResponse({
      message: composition_response
        ? "There are some pending request"
        : "There are no pending request.",
      functionname: functionname,
      data: composition_response ? true : false,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default IsUserComposition;
