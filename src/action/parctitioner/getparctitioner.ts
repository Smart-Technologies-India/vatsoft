"use server";

import { errorToString } from "@/utils/methods";
import { parctitioner } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";

interface GetParctitionerPayload {
  id: number;
}

const GetParctitioner = async (
  payload: GetParctitionerPayload
): Promise<ApiResponseType<parctitioner | null>> => {
  const functionname: string = GetParctitioner.name;

  try {
    const parctitioner = await prisma.parctitioner.findFirst({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
    });

    return createResponse({
      message: parctitioner
        ? "News Get successfully"
        : "Unable to get parctitioner.",
      functionname: functionname,
      data: parctitioner ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetParctitioner;
