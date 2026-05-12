"use server";

import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { ForgetpasswordSchema } from "@/schema/forgetpassword";
import { safeParse } from "valibot";
import { clearOtpSession, isOtpVerified } from "@/lib/forgot-password-otp-store";
import { compare, hash } from "bcrypt";

interface RefineryResetForgetPasswordPayload {
  tin_number: string;
  password: string;
  repassword: string;
}

interface RefineryResetForgetPasswordResponse {
  updated: boolean;
}

const RefineryResetForgetPassword = async (
  payload: RefineryResetForgetPasswordPayload,
): Promise<ApiResponseType<RefineryResetForgetPasswordResponse | null>> => {
  const functionname = RefineryResetForgetPassword.name;

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

  const refinery = await prisma.refinery.findFirst({
    where: {
      tinNumber,
      deletedAt: null,
    },
    select: {
      id: true,
      password: true,
      createdById: true,
    },
  });

  if (!refinery) {
    return createResponse({
      functionname,
      message: "TIN number not found.",
    });
  }

  if (refinery.password) {
    const isPasswordMatch = await compare(parsed.output.password, refinery.password);
    if (isPasswordMatch) {
      return createResponse({
        functionname,
        message: "You can't use the old password",
      });
    }
  }

  const newPassword = await hash(parsed.output.password, 10);

  await prisma.refinery.update({
    where: {
      id: refinery.id,
    },
    data: {
      password: newPassword,
      temppass: parsed.output.password,
    },
  });

  const linkedUserId = refinery.createdById ?? null;

  if (linkedUserId) {
    await prisma.user.update({
      where: {
        id: linkedUserId,
      },
      data: {
        otp: null,
      },
    });
  }

  clearOtpSession(tinNumber);

  return createResponse({
    functionname,
    message: "Password changed successfully.",
    data: {
      updated: true,
    },
  });
};

export default RefineryResetForgetPassword;
