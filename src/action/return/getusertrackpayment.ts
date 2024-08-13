"use server";
interface GetUserTrackPaymentPayload {
  user_id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { returns_01 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetUserTrackPayment = async (
  payload: GetUserTrackPaymentPayload
): Promise<ApiResponseType<returns_01[] | null>> => {
  const functionname: string = GetUserTrackPayment.name;
  try {
    const dvat04response = await prisma.returns_01.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        createdById: payload.user_id,
        NOT: [{ transaction_id: null, track_id: null }],
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

export default GetUserTrackPayment;
