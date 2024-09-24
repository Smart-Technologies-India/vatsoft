"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { returns_01 } from "@prisma/client";
import prisma from "../../../prisma/database";

interface SearchReturnPayload {
  userid?: number;
  rr_number?: string;
  fromdate?: Date;
  todate?: Date;
}

const SearchReturn = async (
  payload: SearchReturnPayload
): Promise<ApiResponseType<returns_01[] | null>> => {
  const functionname: string = SearchReturn.name;

  try {
    const return_01 = await prisma.returns_01.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        ...(payload.userid && { createdById: payload.userid }),
        ...(payload.rr_number && { rr_number: payload.rr_number }),
        ...(payload.fromdate &&
          payload.todate && {
            transaction_date: {
              gte: payload.fromdate,
              lte: payload.todate,
            },
          }),
      },
    });

    return createResponse({
      message: return_01
        ? "Return search Get successfully"
        : "Unable to search return.",
      functionname: functionname,
      data: return_01 ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SearchReturn;
