"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { composition, user } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetCompositionPayload {
  userid: number;
}

const GetComposition = async (
  payload: GetCompositionPayload
): Promise<
  ApiResponseType<Array<composition & { dept_user: user }> | null>
> => {
  const functionname: string = GetComposition.name;

  try {
    const composition_response = await prisma.composition.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        createdById: payload.userid,
      },
      include: {
        dept_user: true,
      },
    });

    return createResponse({
      message: composition_response
        ? "Composition Get successfully"
        : "Unable to get composition.",
      functionname: functionname,
      data: composition_response ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetComposition;
