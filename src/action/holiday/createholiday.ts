"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { holiday } from "@prisma/client";
import prisma from "../../../prisma/database";

interface CreateHolidayPayload {
  createdby: number;
  state: string;
  description: string;
  date: Date;
}

const CreateHoliday = async (
  payload: CreateHolidayPayload
): Promise<ApiResponseType<holiday | null>> => {
  const functionname: string = CreateHoliday.name;

  try {
    const holidaydata = await prisma.holiday.create({
      data: {
        createdById: payload.createdby,
        status: "ACTIVE",
        state: payload.state,
        descrilption: payload.description,
        date: payload.date,
      },
    });

    return createResponse({
      message: holidaydata
        ? "Holiday create successfully"
        : "Unable to holiday.",
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

export default CreateHoliday;
