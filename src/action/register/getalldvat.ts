"use server";
interface GetTempRegNumberPayload {}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";

const GetAllDvat = async (
  payload: GetTempRegNumberPayload
): Promise<ApiResponseType<any[] | null>> => {
  try {
    const dvat04response = await prisma.dvat04.findMany({
      where: {
        NOT: [
          {
            status: "NONE",
          },
        ],
      },
      include: {
        registration: {
          include: {
            dept_user: true,
          },
        },
      },
    });

    if (!dvat04response)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetAllDvat",
      };

    return {
      status: true,
      data: dvat04response,
      message: "dvat04 data get successfully",
      functionname: "GetAllDvat",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetAllDvat",
    };
    return response;
  }
};

export default GetAllDvat;
