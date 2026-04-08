"use server";

import axios from "axios";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import {
  getOtpSession,
  getResendRemainingSeconds,
  maskMobile,
  upsertOtpSession,
} from "@/lib/forgot-password-otp-store";

interface SendForgetPasswordOtpPayload {
  tin_number: string;
}

interface SendForgetPasswordOtpResponse {
  otpSent: boolean;
  resendInSeconds: number;
  maskedMobile: string;
}

const SendForgetPasswordOtp = async (
  payload: SendForgetPasswordOtpPayload,
): Promise<ApiResponseType<SendForgetPasswordOtpResponse | null>> => {
  const functionname = SendForgetPasswordOtp.name;

  try {
    const tinNumber = payload.tin_number.trim();
    if (!tinNumber) {
      return createResponse({
        functionname,
        message: "Enter valid TIN number.",
      });
    }

    const existingSession = getOtpSession(tinNumber);
    const resendInSeconds = getResendRemainingSeconds(tinNumber);
    if (existingSession && resendInSeconds > 0) {
      return createResponse({
        functionname,
        message: `Please wait ${resendInSeconds} second(s) before resending OTP.`,
        data: {
          otpSent: false,
          resendInSeconds,
          maskedMobile: existingSession.maskedMobile,
        },
      });
    }

    const dvat = await prisma.dvat04.findFirst({
      where: {
        tinNumber,
        deletedAt: null,
      },
      select: {
        id: true,
        createdById: true,
        contact_one: true,
      },
    });

    if (!dvat || !dvat.createdById) {
      return createResponse({
        functionname,
        message: "TIN number not found.",
      });
    }

    const contactDigits = (dvat.contact_one ?? "").replace(/\D/g, "");
    const mobile = contactDigits.length > 10 ? contactDigits.slice(-10) : contactDigits;

    if (mobile.length !== 10) {
      return createResponse({
        functionname,
        message: "Registered mobile number not available for this TIN.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const message = encodeURIComponent(
      `Your OTP for login is ${otp}. Do not share this code with anyone. -VAT DDD.`,
    );

    await axios.get(
      `http://sms.smartechwebworks.com/submitsms.jsp?user=dddnhvat&key=781358d943XX&mobile=+91${mobile}&message=${message}&senderid=VATDNH&accusage=1&entityid=1701174159851422588&tempid=1707174989299822848`,
    );

    await prisma.user.update({
      where: {
        id: dvat.createdById,
      },
      data: {
        otp,
      },
    });

    const maskedMobile = maskMobile(mobile);

    upsertOtpSession({
      tinNumber,
      otp,
      maskedMobile,
      dvatId: dvat.id,
      userId: dvat.createdById,
    });

    return createResponse({
      functionname,
      message: `OTP sent successfully to ${maskedMobile}.`,
      data: {
        otpSent: true,
        resendInSeconds: 60,
        maskedMobile,
      },
    });
  } catch (e) {
    return createResponse({
      functionname,
      message: errorToString(e),
    });
  }
};

export default SendForgetPasswordOtp;
