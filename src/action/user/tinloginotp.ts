"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { user } from "@prisma/client";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";

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
        status: "APPROVED",
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

    cookies().set("id", usersresponse.createdBy.id.toString());
    cookies().set("role", usersresponse.createdBy.role.toString());
    cookies().set("dvat", usersresponse.id.toString());

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
