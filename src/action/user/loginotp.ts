"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
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
  try {
    const user = await prisma.user.findFirst({
      where: { mobileOne: payload.mobile, status: "ACTIVE" },
    });

    if (!user)
      return {
        status: false,
        data: null,
        message: "Wrong Mobile Number. Please try again.",
        functionname: "Login",
      };

    if (user.otp !== payload.otp) {
      return {
        status: false,
        data: null,
        message: "Invalid OTP. Please try again.",
        functionname: "LoginOtp",
      };
    }

    const user_resut = await prisma.user.update({
      where: { id: user.id },
      data: {
        mobileOne: payload.mobile,
        firstName: payload.firstname,
        lastName: payload.lastname,
      },
    });

    if (!user_resut) {
      return {
        status: false,
        data: null,
        message: "Unable to update user. Please try again.",
        functionname: "LoginOtp",
      };
    }

    cookies().set("id", user.id.toString());
    return {
      status: true,
      data: user,
      message: "Login successfully",
      functionname: "LoginOtp",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "LoginOtp",
    };
    return response;
  }
};

export default LoginOtp;
