"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04, order_notice, returns_01, user } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetNoticePayload {
  id: number;
}
type ResponseType = {
  user: user;
  dvat: dvat04;
  return01: returns_01 | null;
  notice: order_notice;
};

const GetNotice = async (
  payload: GetNoticePayload
): Promise<ApiResponseType<ResponseType | null>> => {
  const functionname: string = GetNotice.name;

  try {
    const notice = await prisma.order_notice.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
      },
      include: {
        dvat: {
          include: {
            createdBy: true,
          },
        },
        returns_01: true,
      },
    });

    if (!notice) {
      return createResponse({
        message: "Unable to get Notice data.",
        functionname: functionname,
      });
    }

    return createResponse({
      message: "Notice data get successfully",
      functionname: functionname,
      data: {
        notice: notice,
        dvat: notice.dvat,
        user: notice.dvat.createdBy,
        return01: notice.returns_01 ?? null,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetNotice;
