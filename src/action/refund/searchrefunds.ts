"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { refunds } from "@prisma/client";
import prisma from "../../../prisma/database";

interface SearchRfundsPayload {
  dvatid?: number;
  cpin?: string;
  fromdate?: Date;
  todate?: Date;
}

const SearchRefunds = async (
  payload: SearchRfundsPayload
): Promise<ApiResponseType<refunds[] | null>> => {
  const functionname: string = SearchRefunds.name;

  try {
    const refunds = await prisma.refunds.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        ...(payload.dvatid && { dvatid: payload.dvatid }),
        ...(payload.cpin && { cpin: payload.cpin }),
        ...(payload.fromdate &&
          payload.todate && {
            createdAt: {
              gte: payload.fromdate,
              lte: payload.todate,
            },
          }),
      },
    });

    return createResponse({
      message: refunds ? "Refunds Get successfully" : "Unable to get refunds.",
      functionname: functionname,
      data: refunds ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SearchRefunds;
