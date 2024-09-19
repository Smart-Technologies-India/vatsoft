"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { challan } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetAllChallanPayload {}

const GetAllChallan = async (
  payload: GetAllChallanPayload
): Promise<ApiResponseType<challan[] | null>> => {
  const functionname: string = GetAllChallan.name;

  try {
    const challan = await prisma.challan.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
      },
    });

    return createResponse({
      message: challan
        ? "All Challan Get successfully"
        : "Unable to get challan.",
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

export default GetAllChallan;
