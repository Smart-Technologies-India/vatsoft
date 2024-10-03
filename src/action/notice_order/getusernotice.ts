"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { order_notice } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetUserNoticePayload {
  userid: number;
}

const GetUserNotice = async (
  payload: GetUserNoticePayload
): Promise<ApiResponseType<order_notice[] | null>> => {
  const functionname: string = GetUserNotice.name;

  try {
    const dvat = await prisma.dvat04.findFirst({
      where: {
        createdById: payload.userid,
        deletedAt: null,
        deletedById: null,
        OR: [
          {
            status: "APPROVED",
          },
          {
            status: "PROVISIONAL",
          },
        ],
      },
    });

    if (!dvat) {
      return createResponse({
        message: "No Dvat Fount for this user",
        functionname,
      });
    }

    const challan = await prisma.order_notice.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        dvatid: dvat.id,
      },
    });

    return createResponse({
      message: challan
        ? "Notice data get successfully"
        : "Unable to get Notice data.",
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

export default GetUserNotice;
