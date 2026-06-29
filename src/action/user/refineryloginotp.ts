"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { user } from "@prisma/client";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";
import { generateToken } from "@/lib/jwt";

interface RefineryLoginOtpPayload {
  tin_number: string;
  otp: string;
  refinery_id?: number;
}

const RefineryLoginOtp = async (
  payload: RefineryLoginOtpPayload,
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = RefineryLoginOtp.name;

  try {
    const tinNumber = payload.tin_number.trim();

    const refineryResponse = await prisma.refinery.findFirst({
      where: {
        OR: [
          { status: "APPROVED" },
          { status: "VERIFICATION" },
          { status: "PENDINGPROCESSING" },
        ],
        deletedAt: null,
        tinNumber,
        ...(payload.refinery_id ? { id: payload.refinery_id } : {}),
      },
    });

    if (!refineryResponse) {
      return createResponse({
        message: "Wrong TIN Number. Please try again.",
        functionname,
      });
    }

    if (!refineryResponse.createdById) {
      return createResponse({
        message: "No linked user found for this refinery account.",
        functionname,
      });
    }

    const linkedUser = await prisma.user.findFirst({
      where: {
        id: refineryResponse.createdById,
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    if (!linkedUser) {
      return createResponse({
        message: "No linked active user found for this refinery account.",
        functionname,
      });
    }

    if (linkedUser.otpAttempts >= 5) {
      return createResponse({
        message: "Too many failed attempts. Please request a new OTP.",
        functionname,
      });
    }

    if (!linkedUser.otpExpiry || new Date() > new Date(linkedUser.otpExpiry)) {
      return createResponse({
        message: "OTP has expired. Please request a new one.",
        functionname,
      });
    }

    if (linkedUser.otp !== payload.otp) {
      await prisma.user.update({
        where: {
          id: linkedUser.id,
        },
        data: {
          otpAttempts: {
            increment: 1,
          },
        },
      });

      const attemptsLeft = 4 - linkedUser.otpAttempts;

      return createResponse({
        message:
          attemptsLeft > 0
            ? `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`
            : "Invalid OTP. No attempts remaining. Request a new OTP.",
        functionname,
      });
    }

    await prisma.user.update({
      where: {
        id: linkedUser.id,
      },
      data: {
        otp: null,
        otpExpiry: null,
        otpAttempts: 0,
      },
    });

    const cookieStore = await cookies();
    const token = generateToken({
      userId: linkedUser.id,
      mobile: linkedUser.mobileOne ?? "",
      role: linkedUser.role,
      refineryId: refineryResponse.id,
    });

    cookieStore.set("auth_token", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: false, // Only over HTTPS in production
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return createResponse({
      message: "Refinery login successful",
      functionname,
      data: linkedUser,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default RefineryLoginOtp;
