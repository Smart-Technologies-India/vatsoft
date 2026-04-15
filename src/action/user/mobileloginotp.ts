"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { cookies } from "next/headers";
import { generateToken } from "@/lib/jwt";

interface MobileLoginOtpPayload {
  mobile: string;
  otp: string;
}

const MobileLoginOtp = async (
  payload: MobileLoginOtpPayload,
): Promise<ApiResponseType<boolean | null>> => {
  const functionname = MobileLoginOtp.name;

  try {
    const mobile = payload.mobile?.trim();
    const otp = payload.otp?.trim();

    if (!mobile || !otp) {
      return createResponse({
        message: "Mobile number and OTP are required.",
        functionname,
      });
    }

    const user = await prisma.user.findFirst({
      where: { status: "ACTIVE", deletedAt: null, mobileOne: mobile },
    });

    if (!user) {
      return createResponse({
        message: "Wrong Mobile Number. Please try again.",
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiry: null,
        otpAttempts: 0,
      },
    });

    const cookieStore = await cookies();
    const token = generateToken({
      userId: user.id,
      mobile: user.mobileOne ?? "",
      role: user.role,
    });

    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return createResponse({
      message: "Login Successful",
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

export default MobileLoginOtp;
