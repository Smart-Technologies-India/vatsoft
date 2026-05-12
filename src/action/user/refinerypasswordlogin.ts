"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";
import { compare } from "bcrypt";
import { user } from "@prisma/client";
import { generateToken } from "@/lib/jwt";

interface RefineryPasswordLoginPayload {
  tin_number: string;
  password: string;
}

const RefineryPasswordLogin = async (
  payload: RefineryPasswordLoginPayload,
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = RefineryPasswordLogin.name;

  try {
    const cookieStore = await cookies();
    const tinNumber = payload.tin_number.trim();

    const refineryResponse = await prisma.refinery.findFirst({
      where: {
        OR: [{ status: "APPROVED" }, { status: "VERIFICATION" }, { status: "PENDINGPROCESSING" }],
        deletedAt: null,
        tinNumber,
      },
    });

    if (!refineryResponse) {
      return createResponse({
        message: "Wrong Credentials. Please try again.",
        functionname,
      });
    }

    const passwordMatch = await compare(
      payload.password,
      refineryResponse.password ?? "",
    );

    if (!passwordMatch) {
      return createResponse({
        message: "Wrong Credentials. Please try again.",
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

    const token = generateToken({
      userId: linkedUser.id,
      mobile: linkedUser.mobileOne ?? "",
      role: linkedUser.role,
    });

    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return createResponse({
      message: "Refinery login successful",
      functionname,
      data: linkedUser,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default RefineryPasswordLogin;
