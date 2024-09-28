"use server";
interface GetReturnMonthPayload {
  dvatid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { return_filing } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetReturnMonth = async (
  payload: GetReturnMonthPayload
): Promise<ApiResponseType<Array<return_filing> | null>> => {
  const functionname: string = GetReturnMonth.name;
  try {
    const dvat04response = await prisma.return_filing.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        dvatid: payload.dvatid,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!dvat04response)
      return createResponse({
        message: "There is no returns data",
        functionname,
      });

    return createResponse({
      message: "Pending returns data get successfully",
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

export default GetReturnMonth;
