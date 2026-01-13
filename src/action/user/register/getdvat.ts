"use server";
interface GetDvatPayload {}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../../prisma/database";
import { getCurrentDvatId } from "@/lib/auth";

const GetDvat = async (
  payload: GetDvatPayload
): Promise<ApiResponseType<dvat04 | null>> => {
  try {
    const dvatid = await getCurrentDvatId();

    if (dvatid == null || dvatid == undefined) {
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetDvat",
      };
    }

    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        id: dvatid,
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
        functionname: "GetDvat",
      };

    return {
      status: true,
      data: dvat04,
      message: "dvat04 data get successfully",
      functionname: "GetDvat",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetDvat",
    };
    return response;
  }
};

export default GetDvat;
