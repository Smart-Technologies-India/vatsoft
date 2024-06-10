"use server";
interface GetAnx1UserPayload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { annexure1, dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAnx1User = async (
  payload: GetAnx1UserPayload
): Promise<ApiResponseType<annexure1[] | null>> => {
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
        functionname: "GetAnx1User",
      };

    const anx1response = await prisma.annexure1.findMany({
      where: {
        registrationId: registrationresponse.id,
      },
    });

    if (!anx1response)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetAnx1User",
      };

    if (anx1response.length === 0)
      return {
        status: false,
        data: null,
        message: "No data found",
        functionname: "GetAnx1User",
      };

    return {
      status: true,
      data: anx1response,
      message: "ANNEXURE 1 data get successfully",
      functionname: "GetAnx1User",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetAnx1User",
    };
    return response;
  }
};

export default GetAnx1User;
