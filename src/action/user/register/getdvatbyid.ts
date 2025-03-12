"use server";
interface GetDvatByIdPayload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../../prisma/database";
import { cookies } from "next/headers";

const GetDvatById = async (
  payload: GetDvatByIdPayload
): Promise<ApiResponseType<dvat04 | null>> => {
  try {
    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        // createdById: parseInt(payload.userid.toString() ?? "0"),\
        id: payload.id,
        deletedAt: null,
        deletedBy: null,
      },
      include: {
        selectComOne: true,
        selectComTwo: true,
        selectComThree: true,
        selectComFour: true,
        selectComFive: true,
      },
    });

    if (!dvat04)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetDvatById",
      };

    return {
      status: true,
      data: dvat04,
      message: "dvat04 data get successfully",
      functionname: "GetDvatById",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetDvatById",
    };
    return response;
  }
};

export default GetDvatById;
