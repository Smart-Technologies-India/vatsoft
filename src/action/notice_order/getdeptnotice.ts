"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { order_notice, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetDeptNoticePayload {
  dept: SelectOffice;
}

const GetDeptNotice = async (
  payload: GetDeptNoticePayload
): Promise<ApiResponseType<order_notice[] | null>> => {
  const functionname: string = GetDeptNotice.name;

  try {
    const challan = await prisma.order_notice.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat: {
          selectOffice: payload.dept,
        },
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

export default GetDeptNotice;
