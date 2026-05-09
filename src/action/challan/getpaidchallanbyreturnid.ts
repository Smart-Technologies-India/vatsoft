"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { challan } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetPaidChallanByReturnIdPayload {
  returnid: number;
}

const GetPaidChallanByReturnId = async (
  payload: GetPaidChallanByReturnIdPayload,
): Promise<ApiResponseType<challan[] | null>> => {
  const functionname = GetPaidChallanByReturnId.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetPaidChallanByReturnId",
      } as any;
    }

    const challans = await prisma.challan.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        returnid: payload.returnid,
        paymentstatus: "PAID",
      },
      orderBy: {
        transaction_date: "desc",
      },
    });

    return createResponse({
      message: challans ? "Challan entries fetched successfully" : "Unable to get challan entries",
      functionname,
      data: challans ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetPaidChallanByReturnId;
