"use server";
interface GetAnx2Payload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { annexure2, dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAnx2 = async (
  payload: GetAnx2Payload
): Promise<ApiResponseType<annexure2[] | null>> => {
  try {
    const registrationresponse = await prisma.registration.findFirst({
      where: {
        id: parseInt(payload.id.toString() ?? "0"),
      },
    });

    if (!registrationresponse)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetAnx2",
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
        functionname: "GetAnx2",
      };

    if (anx2response.length === 0)
      return {
        status: false,
        data: null,
        message: "No data found",
        functionname: "GetAnx2",
      };

    return {
      status: true,
      data: anx2response,
      message: "ANNEXURE 2 data get successfully",
      functionname: "GetAnx2",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetAnx2",
    };
    return response;
  }
};

export default GetAnx2;
