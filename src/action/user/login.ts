"use server";
interface LoginPayload {
  mobile: string;
  password: string;
}

import { decrypt, errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { user } from "@prisma/client";
import { compare } from "bcrypt";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";

const Login = async (
  payload: LoginPayload
): Promise<ApiResponseType<user | null>> => {
  try {
    const usersresponse = await prisma.user.findMany({
      where: { status: "ACTIVE", deletedAt: null },
    });

    if (!usersresponse) {
      return {
        status: false,
        data: null,
        message: "Unable to get users. Please try again.",
        functionname: "Login",
      };
    }

    const users: user[] = usersresponse.filter(
      (user: user) => decrypt(user.mobileOne) == payload.mobile
    );

    if (users.length == 0) {
      return {
        status: false,
        data: null,
        message: "Unable to get users. Please try again.",
        functionname: "Login",
      };
    }

    const user = users[0];


    if (!user)
      return {
        status: false,
        data: null,
        message: "Invalid Credentials. Please try again.",
        functionname: "Login",
      };


    const password = await compare(payload.password, user.password!);

    if (!password)
      return {
        status: false,
        data: null,
        message: "Invalid Credentials. Please try again.",
        functionname: "Login",
      };
    cookies().set("id", user.id.toString());
    return {
      status: true,
      data: user,
      message: "Login successfully",
      functionname: "Login",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "Login",
    };
    return response;
  }
};

export default Login;
