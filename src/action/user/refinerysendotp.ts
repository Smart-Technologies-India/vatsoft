"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import axios from "axios";

interface RefinerySendOtpPayload {
  tin_number: string;
  refinery_id?: number;
}

interface RefinerySendOtpResponse {
  otpSent: boolean;
  resendInSeconds: number;
  maskedMobile: string;
}

const maskMobile = (mobile: string): string => {
  if (mobile.length < 4) return "XXXX";
  return `XXXXXX${mobile.slice(-4)}`;
};

const RefinerySendOtp = async (
  payload: RefinerySendOtpPayload,
): Promise<ApiResponseType<RefinerySendOtpResponse | null>> => {
  const functionname: string = RefinerySendOtp.name;

  try {
    const tinNumber = payload.tin_number.trim();

    if (!tinNumber) {
      return createResponse({
        message: "Enter valid TIN number.",
        functionname,
      });
    }

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
        message: "TIN number not found.",
        functionname,
      });
    }

    const contactDigits = (refineryResponse.contact_one ?? "").replace(/\D/g, "");
    const mobile =
      contactDigits.length > 10 ? contactDigits.slice(-10) : contactDigits;

    if (mobile.length !== 10) {
      return createResponse({
        message: "Registered mobile number not available for this refinery TIN.",
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

    const maskedMobile = maskMobile(mobile);

    if (linkedUser.otpLastSentAt) {
      const secondsSinceLastSend =
        (Date.now() - new Date(linkedUser.otpLastSentAt).getTime()) / 1000;

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
      `Your OTP for login is ${otp}. Do not share this code with anyone. -VAT DDD.`,
    );

    await axios.get(
      `http://sms.smartechwebworks.com/submitsms.jsp?user=dddnhvat&key=781358d943XX&mobile=+91${mobile}&message=${encodedMessage}&senderid=VATDDD&accusage=1&entityid=1701174159851422588&tempid=1707174989299822848`,
    );

    await prisma.user.update({
      where: {
        id: linkedUser.id,
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

export default RefinerySendOtp;
