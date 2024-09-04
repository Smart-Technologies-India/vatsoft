"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { user } from "@prisma/client";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";

interface LoginOtpPayload {
  mobile: string;
  otp: string;
  firstname: string;
  lastname: string;
}

const LoginOtp = async (
  payload: LoginOtpPayload
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = LoginOtp.name;

  try {
    const usersresponse = await prisma.user.findFirst({
      where: { status: "ACTIVE", deletedAt: null, mobileOne: payload.mobile },
    });

    if (!usersresponse) {
      return createResponse({
        message: "Wrong Mobile Number. Please try again.",
        functionname,
      });
    }

    if (usersresponse.otp !== payload.otp) {
      return createResponse({
        message: "Invalid OTP. Please try again.",
        functionname,
      });
    }

    const user_result = await prisma.user.update({
      where: { id: usersresponse.id },
      data: {
        firstName: payload.firstname,
        lastName: payload.lastname,
      },
    });

    if (!user_result) {
      return createResponse({
        message: "Unable to update user. Please try again.",
        functionname,
      });
    }

    cookies().set("id", user_result.id.toString());

    return createResponse({
      message: "Login successfully",
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default LoginOtp;
