"use server";
import { getCurrentUserId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { holiday } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";

interface GetHolidayPayload {
  id: number;
}

const GetHoliday = async (
  payload: GetHolidayPayload
): Promise<ApiResponseType<holiday | null>> => {
  const functionname: string = GetHoliday.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetHoliday",
      } as any;
    }

    const holiday_data = await prisma.holiday.findFirst({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
    });

    return createResponse({
      message: holiday_data
        ? "Holiday Get successfully"
        : "Unable to get holiday.",
      functionname: functionname,
      data: holiday_data ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetHoliday;
