"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { user } from "@prisma/client";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";
import { generateToken } from "@/lib/jwt";

interface TinLoginOtpPayload {
  tin_number: string;
  otp: string;
}

const TinLoginOtp = async (
  payload: TinLoginOtpPayload
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = TinLoginOtp.name;

  try {
    const usersresponse = await prisma.dvat04.findFirst({
      where: {
        OR: [
          {
            status: "APPROVED",
          },
          {
            status: "VERIFICATION",
          },
          {
            status: "PENDINGPROCESSING",
          }
        ],
        deletedAt: null,
        deletedBy: null,
        tinNumber: payload.tin_number,
      },
      include: {
        createdBy: true,
      },
    });

    if (!usersresponse) {
      return createResponse({
        message: "Wrong TIN Number. Please try again.",
        functionname,
      });
    }

    if (usersresponse.createdBy.otpAttempts >= 5) {
      return createResponse({
        message: "Too many failed attempts. Please request a new OTP.",
        functionname,
      });
    }

    if (
      !usersresponse.createdBy.otpExpiry ||
      new Date() > new Date(usersresponse.createdBy.otpExpiry)
    ) {
      return createResponse({
        message: "OTP has expired. Please request a new one.",
        functionname,
      });
    }

    if (usersresponse.createdBy.otp !== payload.otp) {
      await prisma.user.update({
        where: {
          id: usersresponse.createdBy.id,
        },
        data: {
          otpAttempts: {
            increment: 1,
          },
        },
      });

      const attemptsLeft = 4 - usersresponse.createdBy.otpAttempts;

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
        id: usersresponse.createdBy.id,
      },
      data: {
        otp: null,
        otpExpiry: null,
        otpAttempts: 0,
      },
    });

    const cookieStore = await cookies();
    // Generate secure JWT token
    const token = generateToken({
      userId: usersresponse.createdBy.id,
      mobile: usersresponse.createdBy.mobileOne ?? "",
      role: usersresponse.createdBy.role,
      dvatid: usersresponse.id,
    });

    // Set httpOnly secure cookie
    cookieStore.set("auth_token", token, {
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: process.env.NODE_ENV === "production", // Only over HTTPS in production
      sameSite: "strict", // CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return createResponse({
      message: "Tin Login Successful",
      functionname,
      data: usersresponse.createdBy,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default TinLoginOtp;
