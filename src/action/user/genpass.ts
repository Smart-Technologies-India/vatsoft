"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { user } from "@prisma/client";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";
import { hash } from "bcrypt";

interface GeneratePasswordPayload {
  password: string;
}

const GeneratePassword = async (
  payload: GeneratePasswordPayload
): Promise<ApiResponseType<string | null>> => {
  const functionname: string = GeneratePassword.name;

  try {
    const password = await hash(payload.password, 10);

    return createResponse({
      message: "Password generated Successful",
      functionname,
      data: password,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GeneratePassword;
