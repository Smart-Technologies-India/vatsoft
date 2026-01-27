"use server";

interface GetDvat04ByTinPayload {
  tinNumber: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetDvat04ByTin = async (
  payload: GetDvat04ByTinPayload,
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = GetDvat04ByTin.name;

  try {
    const dvat04response = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        tinNumber: payload.tinNumber,
        OR: [{ status: "APPROVED" }, { status: "PENDINGPROCESSING" }],
      },
    });

    if (!dvat04response)
      return createResponse({
        message: "DVAT record not found with this TIN number.",
        functionname,
      });

    return createResponse({
      message: "DVAT record found successfully",
      functionname,
      data: dvat04response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetDvat04ByTin;
