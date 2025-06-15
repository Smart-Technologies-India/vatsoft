"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import { returns_01, returns_entry } from "@prisma/client";

interface getReturnByDatePayload {
  month: string;
  year: string;
  dvatid: number;
}

const getReturnByDate = async (
  payload: getReturnByDatePayload
): Promise<ApiResponseType<returns_01 | null>> => {
  try {
    const returnforms = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        month: payload.month,
        year: payload.year,
        dvat04Id: payload.dvatid,
      },
    });

    if (!returnforms)
      return {
        status: false,
        data: null,
        message: "Unable to get return froms. Please try again.",
        functionname: "getReturnByDate",
      };

    return {
      status: true,
      data: returnforms,
      message: "Returns forms data get successfully",
      functionname: "getReturnByDate",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "getReturnByDate",
    };
    return response;
  }
};

export default getReturnByDate;
