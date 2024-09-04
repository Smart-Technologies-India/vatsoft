"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { hash } from "bcrypt";
import { user } from "@prisma/client";
import prisma from "../../../prisma/database";

interface CreateUserPayload {
  mobile: string;
  firstname: string;
  lastname: string;
  password: string;
}

const CreateUser = async (
  payload: CreateUserPayload
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = CreateUser.name;

  try {
    const user = await prisma.user.findFirst({
      where: { mobileOne: payload.mobile, status: "ACTIVE" },
    });

    if (user) {
      return createResponse({
        message:
          "Mobile number already exists. Please try another mobile number.",
        functionname,
      });
    }

    const newpassword = await hash(payload.password, 10);
    const newUser = await prisma.user.create({
      data: {
        mobileOne: payload.mobile,
        password: newpassword,
        role: "USER",
        firstName: payload.firstname,
        lastName: payload.lastname,
      },
    });

    return createResponse({
      message: newUser ? "User registered successfully" : "User not created",
      functionname: functionname,
      data: newUser ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateUser;
