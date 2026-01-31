"use server";
interface LoginPayload {
  mobile: string;
  password: string;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { user } from "@prisma/client";
import { compare } from "bcrypt";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";
import { generateToken } from "@/lib/jwt";

const Login = async (
  payload: LoginPayload
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = Login.name;
  const cookiesStore = await cookies();

  try {
    const usersresponse = await prisma.user.findFirst({
      where: { status: "ACTIVE", deletedAt: null, mobileOne: payload.mobile },
    });

    if (!usersresponse) {
      return createResponse({
        message: "Invalid Credentials. Please try again.",
        functionname,
      });
    }

    const password = await compare(
      payload.password,
      usersresponse.password ?? ""
    );

    if (!password) {
      return createResponse({
        message: "Invalid Credentials. Please try again.",
        functionname,
      });
    }

    // Generate secure JWT token
    const token = generateToken({
      userId: usersresponse.id,
      mobile: usersresponse.mobileOne ?? "",
      role: usersresponse.role,
    });

    // Set httpOnly secure cookie
    cookiesStore.set("auth_token", token, {
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: false, // Only over HTTPS in production
      sameSite: "strict", // CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return createResponse({
      message: "Login Successful",
      functionname,
      data: usersresponse,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default Login;
