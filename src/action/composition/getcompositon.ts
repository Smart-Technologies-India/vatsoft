"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { composition, user } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetCompositionPayload {
  id: number;
}

const GetComposition = async (
  payload: GetCompositionPayload
): Promise<
  ApiResponseType<(composition & { dept_user: user; createdBy: user }) | null>
> => {
  const functionname: string = GetComposition.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetComposition",
      } as any;
    }

    const composition_response = await prisma.composition.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
      include: {
        createdBy: true,
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
