"use server";

import { errorToString } from "@/utils/methods";
import { hsncode } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";

interface GetHSNCodePayload {
  id: number;
}

const GetHSNCode = async (
  payload: GetHSNCodePayload
): Promise<ApiResponseType<hsncode | null>> => {
  const functionname: string = GetHSNCode.name;

  try {
    const hsncode_response = await prisma.hsncode.findFirst({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
    });

    return createResponse({
      message: hsncode_response
        ? "HSN Code Get successfully"
        : "Unable to get HSN Code.",
      functionname: functionname,
      data: hsncode_response ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetHSNCode;
