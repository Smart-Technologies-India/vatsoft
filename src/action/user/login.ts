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

const Login = async (
  payload: LoginPayload
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = Login.name;

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

    cookies().set("id", usersresponse.id.toString());
    cookies().set("role", usersresponse.role.toString());
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
