"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { user } from "@prisma/client";

import prisma from "../../../prisma/database";
import axios from "axios";

interface SendOtpPayload {
  mobile: string;
}

const SendOtp = async (
  payload: SendOtpPayload
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = SendOtp.name;

  try {
    const usersresponse = await prisma.user.findFirst({
      where: { status: "ACTIVE", deletedAt: null, mobileOne: payload.mobile },
    });

    const otp = Math.floor(1000 + Math.random() * 9000);

    const response = await axios.get(
      `https://api.arihantsms.com/api/v2/SendSMS?SenderId=DNHPDA&Is_Unicode=false&Is_Flash=false&Message=The%20OTP%20for%20Planning%20and%20Development%20Authority%20Portal%20login%20is%20${otp}.%20The%20OTP%20is%20valid%20for%205%20mins.&MobileNumbers=91${payload.mobile}&ApiKey=rL56LBkGeOa1MKFm5SrSKtz%2Bq55zMVdxk5PNvQkg2nY%3D&ClientId=ebff4d6c-072b-4342-b71f-dcca677713f8`
    );

    if (response.data.Data[0].MessageErrorDescription == "Success") {
      if (usersresponse) {
        const user_resut = await prisma.user.update({
          where: { id: usersresponse.id },
          data: {
            otp: otp.toString(),
          },
        });

        return createResponse({
          message: user_resut
            ? "OTP sent successfully"
            : "Unable to send OTP. Please try again.",
          data: user_resut ?? null,
          functionname,
        });
      } else {
        const user_resut = await prisma.user.create({
          data: {
            mobileOne: payload.mobile,
            otp: otp.toString(),
            role: "USER",
          },
        });

        return createResponse({
          message: user_resut
            ? "OTP sent successfully"
            : "Unable to send OTP. Please try again.",
          data: user_resut ?? null,
          functionname,
        });
      }
    }

    return createResponse({
      message: "Unable to send OTP. Please try again.",
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SendOtp;
