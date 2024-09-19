"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { challan, refunds, user } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetRefundsPayload {
  id: number;
}

const GetRefunds = async (
  payload: GetRefundsPayload
): Promise<ApiResponseType<(refunds & { createdBy: user }) | null>> => {
  const functionname: string = GetRefunds.name;

  try {
    const refunds_response = await prisma.refunds.findFirst({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
      include: {
        createdBy: true,
      },
    });

    return createResponse({
      message: refunds_response
        ? "Refunds Get successfully"
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

export default GetRefunds;
