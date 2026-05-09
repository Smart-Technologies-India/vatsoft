"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import { returns_entry } from "@prisma/client";

interface getReturnEntryPayload {
  returnid: number;
}

const getReturnEntry = async (
  payload: getReturnEntryPayload
): Promise<ApiResponseType<returns_entry[] | null>> => {
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "action",
      } as any;
    }

    const returnforms = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        returns_01Id: payload.returnid,
      },
      include: {
        seller_tin_number: true,
        state: true,
      },
    });

    if (!returnforms)
      return {
        status: false,
        data: null,
        message: "Unable to get return froms. Please try again.",
        functionname: "getPdfReturn",
      };

    return {
      status: true,
      data: returnforms,
      message: "Returns forms data get successfully",
      functionname: "getPdfReturn",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "getPdfReturn",
    };
    return response;
  }
};

export default getReturnEntry;
