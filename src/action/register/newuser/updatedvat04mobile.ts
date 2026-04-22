"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../../prisma/database";

interface UpdateDvat04MobilePayload {
  dvat04Id: number;
  mobile: string;
}

const UpdateDvat04Mobile = async (
  payload: UpdateDvat04MobilePayload
): Promise<ApiResponseType<boolean>> => {
  const functionname = UpdateDvat04Mobile.name;

  try {
    const mobile = payload.mobile.trim();

    if (!payload.dvat04Id || payload.dvat04Id <= 0) {
      return createResponse({
        functionname,
        message: "Invalid DVAT-04 id.",
      });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return createResponse({
        functionname,
        message: "Mobile number must be exactly 10 digits.",
      });
    }

    const existing = await prisma.dvat04.findFirst({
      where: {
        id: payload.dvat04Id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return createResponse({
        functionname,
        message: "DVAT-04 record not found.",
      });
    }

    await prisma.dvat04.update({
      where: {
        id: payload.dvat04Id,
      },
      data: {
        contact_one: mobile,
      },
    });

    return createResponse({
      functionname,
      message: "Mobile number updated successfully.",
      data: true,
    });
  } catch (error) {
    return createResponse({
      functionname,
      message: errorToString(error),
    });
  }
};

export default UpdateDvat04Mobile;
