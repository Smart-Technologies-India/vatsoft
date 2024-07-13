"use server";

import { encrypt, errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { hash } from "bcrypt";
import { Role, user } from "@prisma/client";
import prisma from "../../../prisma/database";

interface CreateUserPayload {
  mobile: string;
  password: string;
  role: Role;
}

const createUser = async (
  payload: CreateUserPayload
): Promise<ApiResponseType<user | null>> => {
  try {
    const user = await prisma.user.findFirst({
      where: { mobileOne: encrypt(payload.mobile), status: "ACTIVE" },
    });

    if (user)
      return {
        status: false,
        data: null,
        message:
          "Mobile  number already exists. Please try another mobile number.",
        functionname: "createUsers",
      };

    const newpassword = await hash(payload.password, 10);
    const newUser = await prisma.user.create({
      data: {
        mobileOne: encrypt(payload.mobile),
        password: newpassword,
        role: payload.role,
      },
    });

    if (!newUser)
      return {
        status: false,
        data: null,
        message: "User not created",
        functionname: "createUser",
      };

    return {
      status: true,
      data: newUser,
      message: "User register successfully",
      functionname: "createUser",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "createUser",
    };
    return response;
  }
};

export default createUser;
