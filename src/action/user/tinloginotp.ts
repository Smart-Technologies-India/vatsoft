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
        ],
        deletedAt: null,
        tinNumber: payload.tin_number,
      },
      include: {
        createdBy: true,
      },
    });

    if (!usersresponse) {
      return createResponse({
        message: "Wrong Mobile Number. Please try again.",
        functionname,
      });
    }

    if (usersresponse.createdBy.otp !== payload.otp) {
      return createResponse({
        message: "Invalid OTP. Please try again.",
        functionname,
      });
    }

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
