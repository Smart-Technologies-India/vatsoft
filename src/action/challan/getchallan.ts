"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { challan, returns_01 } from "@prisma/client";
import prisma from "../../../prisma/database";

export type ChallanWithReturn = challan & { returns_01: returns_01 | null };

interface GetChallanPayload {
  id: number;
}

const GetChallan = async (
  payload: GetChallanPayload
): Promise<ApiResponseType<ChallanWithReturn | null>> => {
  const functionname: string = GetChallan.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetChallan",
      } as any;
    }

    const challan = await prisma.challan.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
      include: {
        returns_01: true,
      },
    });

    return createResponse({
      message: challan ? "Challan Get successfully" : "Unable to get challan.",
      functionname: functionname,
      data: challan ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetChallan;
