"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface GetAnx1Payload {
  dvatid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { annexure1 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAnx1 = async (
  payload: GetAnx1Payload
): Promise<ApiResponseType<annexure1[] | null>> => {
  const functionname: string = GetAnx1.name;
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetAnx1",
      } as any;
    }

    const anx1response = await prisma.annexure1.findMany({
      where: {
        dvatId: payload.dvatid,
        deletedAt: null,
        deletedBy: null,
        status: "ACTIVE",
      },
    });

    if (!anx1response)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    if (anx1response.length === 0)
      return createResponse({
        message: "No data found",
        functionname,
      });

    return createResponse({
      message: "ANNEXURE 1 data get successfully",
      functionname,
      data: anx1response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAnx1;
