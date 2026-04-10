"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";

import prisma from "../../../prisma/database";
import axios from "axios";

interface TinSendOtpPayload {
  tin_number: string;
}

interface TinSendOtpResponse {
  otpSent: boolean;
  resendInSeconds: number;
  maskedMobile: string;
}

const maskMobile = (mobile: string): string => {
  if (mobile.length < 4) return "XXXX";
  return `XXXXXX${mobile.slice(-4)}`;
};

const TinSendOtp = async (
  payload: TinSendOtpPayload
): Promise<ApiResponseType<TinSendOtpResponse | null>> => {
  const functionname: string = TinSendOtp.name;

  try {
    const tinNumber = payload.tin_number.trim();

    if (!tinNumber) {
      return createResponse({
        message: "Enter valid TIN number.",
        functionname,
      });
    }

    const dvat_response = await prisma.dvat04.findFirst({
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
          },
        ],
        deletedAt: null,
        deletedBy: null,
        tinNumber,
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

    const contactDigits = (dvat_response.contact_one ?? "").replace(/\D/g, "");
    const mobile =
      contactDigits.length > 10 ? contactDigits.slice(-10) : contactDigits;

    if (mobile.length !== 10) {
      return createResponse({
        message: "Registered mobile number not available for this TIN.",
        functionname,
      });
    }

    const maskedMobile = maskMobile(mobile);

    if (dvat_response.createdBy.otpLastSentAt) {
      const secondsSinceLastSend =
        (Date.now() - new Date(dvat_response.createdBy.otpLastSentAt).getTime()) /
        1000;

      if (secondsSinceLastSend < 60) {
        const resendInSeconds = Math.ceil(60 - secondsSinceLastSend);
        return createResponse({
          message: `Please wait ${resendInSeconds} second(s) before requesting a new OTP.`,
          data: {
            otpSent: false,
            resendInSeconds,
            maskedMobile,
          },
          functionname,
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    const encodedMessage = encodeURIComponent(
      `Your OTP for login is ${otp}. Do not share this code with anyone. -VAT DDD.`
    );

    await axios.get(
      `http://sms.smartechwebworks.com/submitsms.jsp?user=dddnhvat&key=781358d943XX&mobile=+91${mobile}&message=${encodedMessage}&senderid=VATDDD&accusage=1&entityid=1701174159851422588&tempid=1707174989299822848`
    );

    await prisma.user.update({
      where: {
        id: dvat_response.createdBy.id,
      },
      data: {
        otp: otp.toString(),
        otpExpiry,
        otpAttempts: 0,
        otpLastSentAt: new Date(),
      },
    });

    return createResponse({
      message: `OTP sent successfully to ${maskedMobile}.`,
      data: {
        otpSent: true,
        resendInSeconds: 60,
        maskedMobile,
      },
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
