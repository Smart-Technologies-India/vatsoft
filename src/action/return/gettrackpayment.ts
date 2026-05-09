"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface GetTrackPaymentPayload {}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { returns_01, returns_entry } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetTrackPayment = async (
  payload: GetTrackPaymentPayload
): Promise<ApiResponseType<returns_entry[] | null>> => {
  const functionname: string = GetTrackPayment.name;
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetTrackPayment",
      } as any;
    }

    const dvat04response = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
      },
      include: {
        returns_01: true,
      },
    });

    if (!dvat04response)
      return createResponse({
        message: "Invalid user id. Please try again.",
        functionname,
      });

    return createResponse({
      message: "dvat04 data get successfully",
      functionname,
      data: dvat04response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetTrackPayment;
