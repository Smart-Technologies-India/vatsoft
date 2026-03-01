"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  dvat04,
  returns_01,
  returns_entry,
  state,
  tin_number_master,
} from "@prisma/client";

interface GetReturnEntryReportByIdPayload {
  id: number;
}

const getReturnEntryReportById = async (
  payload: GetReturnEntryReportByIdPayload,
): Promise<
  ApiResponseType<{
    returns_01: returns_01 & { dvat04: dvat04 };
    returns_entry: (returns_entry & {
      seller_tin_number: tin_number_master;
      state: state | null;
    })[];
  } | null>
> => {
  const functionname: string = getReturnEntryReportById.name;

  try {
    const return01 = await prisma.returns_01.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
      },
      include: {
        dvat04: true,
      },
    });

    if (!return01) {
      return createResponse({
        message: "Invalid return id. Please try again.",
        functionname,
      });
    }

    const entries = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        returns_01Id: return01.id,
      },
      include: {
        seller_tin_number: true,
        state: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return createResponse({
      message: "Returns report data fetched successfully",
      functionname,
      data: {
        returns_01: return01,
        returns_entry: entries,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default getReturnEntryReportById;
