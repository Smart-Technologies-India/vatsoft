"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { refunds } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetAllRefundsPayload {}

const GetAllRefunds = async (
  payload: GetAllRefundsPayload
): Promise<ApiResponseType<refunds[] | null>> => {
  const functionname: string = GetAllRefunds.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetAllRefunds",
      } as any;
    }

    const refunds_response = await prisma.refunds.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
      },
    });

    return createResponse({
      message: refunds_response
        ? "All refunds Get successfully"
        : "Unable to get refunds.",
      functionname: functionname,
      data: refunds_response ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAllRefunds;
