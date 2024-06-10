"use server";
interface GetAnx2UserPayload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { annexure2, dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAnx2User = async (
  payload: GetAnx2UserPayload
): Promise<ApiResponseType<annexure2[] | null>> => {
  try {
    const registrationresponse = await prisma.registration.findFirst({
      where: {
        userId: parseInt(payload.userid.toString() ?? "0"),
      },
    });

    if (!registrationresponse)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetAnx2User",
      };

    const anx2response = await prisma.annexure2.findMany({
      where: {
        registrationId: registrationresponse.id,
      },
    });

    if (!anx2response)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetAnx2User",
      };

    if (anx2response.length === 0)
      return {
        status: false,
        data: null,
        message: "No data found",
        functionname: "GetAnx2User",
      };

    return {
      status: true,
      data: anx2response,
      message: "ANNEXURE 2 data get successfully",
      functionname: "GetAnx2User",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetAnx2User",
    };
    return response;
  }
};

export default GetAnx2User;
