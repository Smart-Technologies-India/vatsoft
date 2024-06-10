"use server";
interface GetAnxByIdPayload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { annexure2 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAnx2ById = async (
  payload: GetAnxByIdPayload
): Promise<ApiResponseType<annexure2 | null>> => {
  try {
    const anx2response = await prisma.annexure2.findFirst({
      where: {
        id: parseInt(payload.id.toString() ?? "0"),
      },
    });

    if (!anx2response)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetAnx2ById",
      };

    return {
      status: true,
      data: anx2response,
      message: "ANNEXURE 2 data get successfully",
      functionname: "GetAnx2ById",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetAnx2ById",
    };
    return response;
  }
};

export default GetAnx2ById;
