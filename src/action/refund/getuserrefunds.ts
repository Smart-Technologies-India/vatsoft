"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { refunds } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetUserRefundsPayload {
  dvatid: number;
}

const GetUserRefunds = async (
  payload: GetUserRefundsPayload
): Promise<ApiResponseType<refunds[] | null>> => {
  const functionname: string = GetUserRefunds.name;

  try {
    const refunds = await prisma.refunds.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        dvatid: payload.dvatid,
      },
    });

    return createResponse({
      message: refunds ? "Refunds Get successfully" : "Unable to get refunds.",
      functionname: functionname,
      data: refunds ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetUserRefunds;
