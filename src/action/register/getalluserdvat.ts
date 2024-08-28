"use server";
interface GetTempRegNumberPayload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAllUserDvat = async (
  payload: GetTempRegNumberPayload
): Promise<ApiResponseType<dvat04[] | null>> => {
  const functionname: string = GetAllUserDvat.name;

  try {
    const dvatresponse = await prisma.dvat04.findMany({
      where: {
        createdById: parseInt(payload.userid.toString() ?? "0"),
        NOT: [
          {
            status: "NONE",
          },
        ],
      },
    });

    if (!dvatresponse)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    return createResponse({
      data: dvatresponse,
      message: "dvat04 data get successfully",
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAllUserDvat;
