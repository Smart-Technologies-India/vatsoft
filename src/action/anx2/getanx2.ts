"use server";
interface GetAnx2Payload {
  dvatid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { annexure2 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetAnx2 = async (
  payload: GetAnx2Payload
): Promise<ApiResponseType<annexure2[] | null>> => {
  const functionname: string = GetAnx2.name;

  try {
    const anx2response = await prisma.annexure2.findMany({
      where: {
        dvatId: payload.dvatid,
      },
    });

    if (!anx2response)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    if (anx2response.length === 0)
      return createResponse({
        message: "No data found",
        functionname,
      });

    return createResponse({
      data: anx2response,
      message: "ANNEXURE 2 data get successfully",
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAnx2;
