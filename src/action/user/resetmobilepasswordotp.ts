"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { hash, compare } from "bcrypt";
import { safeParse } from "valibot";
import { ForgetpasswordSchema } from "@/schema/forgetpassword";

interface ResetMobilePasswordOtpPayload {
  mobile: string;
  otp: string;
  password: string;
  repassword: string;
}

const ResetMobilePasswordOtp = async (
  payload: ResetMobilePasswordOtpPayload,
): Promise<ApiResponseType<boolean | null>> => {
  const functionname = ResetMobilePasswordOtp.name;

  try {
    const mobile = payload.mobile?.trim();
    const otp = payload.otp?.trim();

    if (!mobile || !otp) {
      return createResponse({
        message: "Mobile number and OTP are required.",
        functionname,
      });
    }

    const parsed = safeParse(ForgetpasswordSchema, {
      password: payload.password,
      repassword: payload.repassword,
    });

    if (!parsed.success) {
      return createResponse({
        message: parsed.issues[0]?.message ?? "Invalid password details.",
        functionname,
      });
    }

    const user = await prisma.user.findFirst({
      where: { status: "ACTIVE", deletedAt: null, mobileOne: mobile },
    });

    if (!user) {
      return createResponse({
        message: "User not found. Please check your mobile number.",
        functionname,
      });
    }

    if ((user.otpAttempts ?? 0) >= 5) {
      return createResponse({
        message: "Too many failed attempts. Please request a new OTP.",
        functionname,
      });
    }

    if (!user.otpExpiry || new Date() > new Date(user.otpExpiry)) {
      return createResponse({
        message: "OTP has expired. Please request a new one.",
        functionname,
      });
    }

    if (user.otp !== otp) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: { increment: 1 } },
      });

      const remaining = 4 - (user.otpAttempts ?? 0);
      return createResponse({
        message:
          remaining > 0
            ? `Invalid OTP. ${remaining} attempt(s) remaining.`
            : "Invalid OTP. No attempts remaining. Request a new OTP.",
        functionname,
      });
    }

    const sameAsOldPassword = await compare(parsed.output.password, user.password ?? "");
    if (sameAsOldPassword) {
      return createResponse({
        message: "You can't use the old password",
        functionname,
      });
    }

    const hashedPassword = await hash(parsed.output.password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
        otpAttempts: 0,
      },
    });

    return createResponse({
      message: "Password updated successfully.",
      functionname,
      data: true,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default ResetMobilePasswordOtp;
