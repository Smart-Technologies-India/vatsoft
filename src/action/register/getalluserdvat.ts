"use server";
interface GetTempRegNumberPayload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAllUserDvat = async (
  payload: GetTempRegNumberPayload
): Promise<ApiResponseType<dvat04[] | null>> => {
  try {
    const registerresponse = await prisma.registration.findMany({
      where: {
        userId: parseInt(payload.userid.toString() ?? "0"),
      },
      include: { dvat04: true },
    });

    if (!registerresponse)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetTempRegNumber",
      };

    let dvat04response: dvat04[] = [];

    for (let i = 0; i < registerresponse.length; i++) {
      dvat04response.push(...registerresponse[i].dvat04);
    }

    return {
      status: true,
      data: dvat04response,
      message: "dvat04 data get successfully",
      functionname: "GetTempRegNumber",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetTempRegNumber",
    };
    return response;
  }
};

export default GetAllUserDvat;
