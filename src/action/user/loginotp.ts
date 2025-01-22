"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";
import { setCookie } from "cookies-next";

interface LoginOtpPayload {
  mobile: string;
  otp: string;
  firstname: string;
  lastname: string;
}

interface LoginOtpResponse {
  data: dvat04[];
  id: number;
  role: string;
}

const LoginOtp = async (
  payload: LoginOtpPayload
): Promise<ApiResponseType<LoginOtpResponse | null>> => {
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

    const dvat_response = await prisma.dvat04.findMany({
      where: {
        status: "APPROVED",
        createdById: usersresponse.id,
      },
    });

    // if (dvat_response.length === 0) {
    //   return createResponse({
    //     message: "No TIN found for this user.",
    //     functionname,
    //   });
    // }

    // cookies().set("id", user_result.id.toString());
    // cookies().set("role", user_result.role.toString());

    // setCookie("id", user_result.id.toString());
    // setCookie("role", user_result.role.toString());

    return createResponse({
      message: "Login Successful",
      functionname,
      data: {
        data: dvat_response,
        id: user_result.id,
        role: user_result.role,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default LoginOtp;
