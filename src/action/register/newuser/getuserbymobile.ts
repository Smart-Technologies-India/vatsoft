"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../../prisma/database";
import { user } from "@prisma/client";

interface GetUserByMobilePayload {
  mobile: string;
}

const GetUserByMobile = async (
  payload: GetUserByMobilePayload
): Promise<ApiResponseType<user | null>> => {
  const functionname = GetUserByMobile.name;

  try {
    const mobile = payload.mobile.trim();

    if (!mobile) {
      return createResponse({
        functionname,
        message: "Mobile number is required.",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        mobileOne: mobile,
        deletedAt: null,
      },
    });

    return createResponse({
      functionname,
      message: existingUser ? "User found." : "User not found.",
      data: existingUser ?? null,
    });
  } catch (error) {
    return createResponse({
      functionname,
      message: errorToString(error),
    });
  }
};

export default GetUserByMobile;
