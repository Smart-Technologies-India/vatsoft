"use server";

import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { ForgetpasswordSchema } from "@/schema/forgetpassword";
import { safeParse } from "valibot";
import DvatChangePassword from "@/action/user/dvatchangepassword";
import { clearOtpSession, isOtpVerified } from "@/lib/forgot-password-otp-store";

interface ResetForgetPasswordPayload {
  tin_number: string;
  password: string;
  repassword: string;
}

interface ResetForgetPasswordResponse {
  updated: boolean;
}

const ResetForgetPassword = async (
  payload: ResetForgetPasswordPayload,
): Promise<ApiResponseType<ResetForgetPasswordResponse | null>> => {
  const functionname = ResetForgetPassword.name;

  const tinNumber = payload.tin_number.trim();

  if (!tinNumber) {
    return createResponse({
      functionname,
      message: "Enter valid TIN number.",
    });
  }

  if (!isOtpVerified(tinNumber)) {
    return createResponse({
      functionname,
      message: "Please verify OTP before changing password.",
    });
  }

  const parsed = safeParse(ForgetpasswordSchema, {
    password: payload.password,
    repassword: payload.repassword,
  });

  if (!parsed.success) {
    const firstIssue = parsed.issues[0];
    const message = firstIssue.input
      ? firstIssue.message
      : `${String(firstIssue.path?.[0]?.key ?? "Field")} is required`;

    return createResponse({
      functionname,
      message,
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
    },
  });

  if (!dvat) {
    return createResponse({
      functionname,
      message: "TIN number not found.",
    });
  }

  const changeResponse = await DvatChangePassword({
    id: dvat.id,
    password: parsed.output.password,
  });

  if (!changeResponse.status) {
    return createResponse({
      functionname,
      message: changeResponse.message,
    });
  }

  await prisma.user.update({
    where: {
      id: dvat.createdById,
    },
    data: {
      otp: null,
    },
  });

  clearOtpSession(tinNumber);

  return createResponse({
    functionname,
    message: "Password changed successfully.",
    data: {
      updated: true,
    },
  });
};

export default ResetForgetPassword;
