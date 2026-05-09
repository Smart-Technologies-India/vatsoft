"use server";
import { getCurrentUserId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { holiday } from "@prisma/client";
import prisma from "../../../prisma/database";

interface UpdateHolidayPayload {
  id: number;
  updatedby: number;
  description: string;
  state: string;
  date: Date;
}

const UpdateHoliday = async (
  payload: UpdateHolidayPayload
): Promise<ApiResponseType<holiday | null>> => {
  const functionname: string = UpdateHoliday.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "UpdateHoliday",
      } as any;
    }

    const isholiday = await prisma.holiday.findFirst({
      where: { id: payload.id, status: "ACTIVE" },
    });
    if (!isholiday) {
      return createResponse({
        message: "Something went wrong unable to create holiday. Try again!",
        functionname,
      });
    }

    const holidaydata = await prisma.holiday.update({
      where: {
        id: payload.id,
      },
      data: {
        updatedById: payload.updatedby,
        status: "ACTIVE",
        state: payload.state,
        descrilption: payload.description,
        date: payload.date,
      },
    });

    return createResponse({
      message: holidaydata
        ? "Holiday updated successfully"
        : "Unable to udpate holiday.",
      functionname: functionname,
      data: holidaydata ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default UpdateHoliday;
