"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { user } from "@prisma/client";

import prisma from "../../../prisma/database";
import axios from "axios";

interface TinSendOtpPayload {
  tin_number: string;
}

const TinSendOtp = async (
  payload: TinSendOtpPayload
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = TinSendOtp.name;

  try {
    const dvat_response = await prisma.dvat04.findFirst({
      where: {
        // status: "APPROVED",
        deletedAt: null,
        tinNumber: payload.tin_number,
      },
      include: {
        createdBy: true,
      },
    });

    if (!dvat_response) {
      return createResponse({
        message: "TIN number not found.",
        functionname,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    // const response = await axios.get(
    //   `https://api.arihantsms.com/api/v2/SendSMS?SenderId=DNHPDA&Is_Unicode=false&Is_Flash=false&Message=The%20OTP%20for%20Planning%20and%20Development%20Authority%20Portal%20login%20is%20${otp}.%20The%20OTP%20is%20valid%20for%205%20mins.&MobileNumbers=919773356997&ApiKey=rL56LBkGeOa1MKFm5SrSKtz%2Bq55zMVdxk5PNvQkg2nY%3D&ClientId=ebff4d6c-072b-4342-b71f-dcca677713f8`
    // );
    const response = await axios.get(
      `https://api.arihantsms.com/api/v2/SendSMS?SenderId=DNHPDA&Is_Unicode=false&Is_Flash=false&Message=The%20OTP%20for%20Planning%20and%20Development%20Authority%20Portal%20login%20is%20${otp}.%20The%20OTP%20is%20valid%20for%205%20mins.&MobileNumbers=919586908178&ApiKey=rL56LBkGeOa1MKFm5SrSKtz%2Bq55zMVdxk5PNvQkg2nY%3D&ClientId=ebff4d6c-072b-4342-b71f-dcca677713f8`
    );

    if (response.data.Data[0].MessageErrorDescription == "Success") {
      const user_resut = await prisma.user.update({
        where: {
          id: dvat_response.createdBy.id,
          status: "ACTIVE",
          deletedAt: null,
        },
        data: {
          otp: otp.toString(),
        },
      });

      return createResponse({
        message: user_resut
          ? "OTP sent successfully"
          : "Unable to send OTP. User not found.",
        data: user_resut ?? null,
        functionname,
      });
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

export default TinSendOtp;
