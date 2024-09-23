"use server";
interface SearchTinNumberPayload {
  tinumber: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04, user } from "@prisma/client";
import prisma from "../../../prisma/database";

const SearchTinNumber = async (
  payload: SearchTinNumberPayload
): Promise<ApiResponseType<(dvat04 & { createdBy: user }) | null>> => {
  const functionname: string = SearchTinNumber.name;

  try {
    const dvat04response = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        tinNumber: payload.tinumber,
        status: "APPROVED",
      },
      include: {
        createdBy: true,
      },
    });

    if (!dvat04response)
      return createResponse({
        message: "Dvat not found. Please try again.",
        functionname,
      });

    return createResponse({
      message: "DVAT-04 data get successfully",
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

export default SearchTinNumber;
