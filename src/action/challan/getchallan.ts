"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { challan } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetChallanPayload {
  id: number;
}

const GetChallan = async (
  payload: GetChallanPayload
): Promise<ApiResponseType<challan | null>> => {
  const functionname: string = GetChallan.name;

  try {
    const challan = await prisma.challan.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
    });

    return createResponse({
      message: challan ? "Challan Get successfully" : "Unable to get challan.",
      functionname: functionname,
      data: challan ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetChallan;
