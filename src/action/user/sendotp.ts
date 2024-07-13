"use server";

import { encrypt, errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { user } from "@prisma/client";

import prisma from "../../../prisma/database";
import axios from "axios";

interface SendOtpPayload {
  mobile: string;
}

const SendOtp = async (
  payload: SendOtpPayload
): Promise<ApiResponseType<user | null>> => {
  try {
    const user = await prisma.user.findFirst({
      where: { mobileOne: encrypt(payload.mobile), status: "ACTIVE" },
    });

    const otp = Math.floor(1000 + Math.random() * 9000);

    // Send OTP to user

    const response = await axios.get(
      `https://api.arihantsms.com/api/v2/SendSMS?SenderId=DNHPDA&Is_Unicode=false&Is_Flash=false&Message=The%20OTP%20for%20Planning%20and%20Development%20Authority%20Portal%20login%20is%20${otp}.%20The%20OTP%20is%20valid%20for%205%20mins.&MobileNumbers=91${payload.mobile}&ApiKey=rL56LBkGeOa1MKFm5SrSKtz%2Bq55zMVdxk5PNvQkg2nY%3D&ClientId=ebff4d6c-072b-4342-b71f-dcca677713f8`
    );

    if (response.data.Data[0].MessageErrorDescription == "Success") {
      if (user) {
        const user_resut = await prisma.user.update({
          where: { id: user.id },
          data: {
            otp: otp.toString(),
          },
        });
        if (!user_resut) {
          return {
            status: false,
            data: null,
            message: "Unable to send OTP. Please try again.",
            functionname: "SendOtp",
          };
        } else {
          return {
            status: true,
            data: user_resut,
            message: "OTP sent successfully",
            functionname: "SendOtp",
          };
        }
      } else {
        const user_resut = await prisma.user.create({
          data: {
            mobileOne: encrypt(payload.mobile),
            otp: otp.toString(),
            role: "USER",
          },
        });
        if (!user_resut) {
          return {
            status: false,
            data: null,
            message: "Unable to send OTP. Please try again.",
            functionname: "SendOtp",
          };
        } else {
          return {
            status: true,
            data: user_resut,
            message: "OTP sent successfully",
            functionname: "SendOtp",
          };
        }
      }
    }

    return {
      status: false,
      data: null,
      message: "Unable to send OTP. Please try again.",
      functionname: "SendOtp",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "SendOtp",
    };
    return response;
  }
};

export default SendOtp;
