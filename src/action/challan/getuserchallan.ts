"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { challan } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetUserChallanPayload {
  userid: number;
}

const GetUserChallan = async (
  payload: GetUserChallanPayload
): Promise<ApiResponseType<challan[] | null>> => {
  const functionname: string = GetUserChallan.name;

  try {
    const challan = await prisma.challan.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        createdById: payload.userid,
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

export default GetUserChallan;
