"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";

import prisma from "../../../prisma/database";

interface VerifyOtpPayload {
  mobile: string;
  otp: string;
}

const VerifyOtp = async (
  payload: VerifyOtpPayload
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = VerifyOtp.name;

  try {
    const usersresponse = await prisma.user.findFirst({
      where: { status: "ACTIVE", deletedAt: null, mobileOne: payload.mobile },
    });

    if (!usersresponse) {
      return createResponse({
        message: "User not found. Please register first.",
        functionname,
      });
    }

    if (usersresponse.otp !== payload.otp) {
      return createResponse({
        message: "Invalid OTP. Please try again.",
        functionname,
      });
    }

    return createResponse({
      message: "OTP verified successfully.",
      data: true,
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default VerifyOtp;
