"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { composition, user } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetUserCompositionPayload {
  dvatid?: number;
}

const GetUserComposition = async (
  payload: GetUserCompositionPayload
): Promise<
  ApiResponseType<Array<composition & { dept_user: user }> | null>
> => {
  const functionname: string = GetUserComposition.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetUserComposition",
      } as any;
    }

    const composition_response = await prisma.composition.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        ...(payload.dvatid && { dvatid: payload.dvatid }),
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

export default GetUserComposition;
