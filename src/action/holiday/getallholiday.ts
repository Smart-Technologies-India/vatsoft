"use server";

import { errorToString } from "@/utils/methods";
import { holiday } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetAllHolidayPayload {
  skip: number;
  take: number;
}

const GetAllHoliday = async (
  payload: GetAllHolidayPayload
): Promise<PaginationResponse<holiday[] | null>> => {
  const functionname: string = GetAllHoliday.name;

  try {
    const [holidays, totalCount] = await Promise.all([
      prisma.holiday.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
        skip: payload.skip,
        take: payload.take,
        orderBy: [
          {
            date: "desc",
          },
        ],
      }),
      prisma.holiday.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
      }),
    ]);

    return createPaginationResponse({
      message: holidays ? "Holiday Get successfully" : "Unable to get holiday.",
      functionname: functionname,
      data: holidays ?? null,
      skip: payload.skip,
      take: payload.take,
      total: totalCount,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAllHoliday;
