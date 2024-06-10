"use server";
interface GetAnxByIdPayload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { annexure1 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAnx1ById = async (
  payload: GetAnxByIdPayload
): Promise<ApiResponseType<annexure1 | null>> => {
  try {
    const anx1response = await prisma.annexure1.findFirst({
      where: {
        id: parseInt(payload.id.toString() ?? "0"),
      },
    });

    if (!anx1response)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetAnx1ById",
      };

    return {
      status: true,
      data: anx1response,
      message: "ANNEXURE 1 data get successfully",
      functionname: "GetAnx1ById",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetAnx1ById",
    };
    return response;
  }
};

export default GetAnx1ById;
