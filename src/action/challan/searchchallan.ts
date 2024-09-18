"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { challan } from "@prisma/client";
import prisma from "../../../prisma/database";

interface SearchChallanPayload {
  userid: number;
  cpin?: string;
  fromdate?: Date;
  todate?: Date;
}

const SearchChallan = async (
  payload: SearchChallanPayload
): Promise<ApiResponseType<challan[] | null>> => {
  const functionname: string = SearchChallan.name;

  try {
    const challan = await prisma.challan.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        createdById: payload.userid,
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

export default SearchChallan;
