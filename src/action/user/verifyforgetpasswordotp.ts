"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { verifyOtpCode } from "@/lib/forgot-password-otp-store";

interface VerifyForgetPasswordOtpPayload {
  tin_number: string;
  otp: string;
}

interface VerifyForgetPasswordOtpResponse {
  verified: boolean;
  attemptsLeft: number;
  maskedMobile: string;
}

const VerifyForgetPasswordOtp = async (
  payload: VerifyForgetPasswordOtpPayload,
): Promise<ApiResponseType<VerifyForgetPasswordOtpResponse | null>> => {
  const functionname = VerifyForgetPasswordOtp.name;

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

export default VerifyForgetPasswordOtp;
