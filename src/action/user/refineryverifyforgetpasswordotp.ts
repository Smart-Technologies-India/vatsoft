"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { verifyOtpCode } from "@/lib/forgot-password-otp-store";

interface RefineryVerifyForgetPasswordOtpPayload {
  tin_number: string;
  otp: string;
}

interface RefineryVerifyForgetPasswordOtpResponse {
  verified: boolean;
  attemptsLeft: number;
  maskedMobile: string;
}

const RefineryVerifyForgetPasswordOtp = async (
  payload: RefineryVerifyForgetPasswordOtpPayload,
): Promise<ApiResponseType<RefineryVerifyForgetPasswordOtpResponse | null>> => {
  const functionname = RefineryVerifyForgetPasswordOtp.name;

  const tinNumber = payload.tin_number.trim();
  const otp = payload.otp.trim();

  if (!tinNumber || !otp) {
    return createResponse({
      functionname,
      message: "TIN number and OTP are required.",
    });
  }

  const result = verifyOtpCode(tinNumber, otp);

  return createResponse({
    functionname,
    message: result.message,
    data: {
      verified: result.ok,
      attemptsLeft: result.attemptsLeft,
      maskedMobile: result.maskedMobile,
    },
  });
};

export default RefineryVerifyForgetPasswordOtp;
