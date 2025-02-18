"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { user } from "@prisma/client";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";
import { hash } from "bcrypt";

interface GeneratePasswordPayload {
  // password: string;
}

const GeneratePassword = async (
  payload: GeneratePasswordPayload
): Promise<ApiResponseType<string | null>> => {
  const functionname: string = GeneratePassword.name;

  try {
    const all_users = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: "USER",
        deletedAt: null,
      },
    });

    if (!all_users) {
      return createResponse({
        message: "No user found",
        functionname,
        data: null,
      });
    }

    for (let i = 0; i < all_users.length; i++) {
      const user = all_users[i];
      const password = genrenpass();
      const hashedPassword = await hash(password, 10);
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
          temppass: password,
        },
      });
    }

    // const password = await hash(payload.password, 10);

    return createResponse({
      message: "Password generated Successful",
      functionname,
      data: "Password generated Successful",
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GeneratePassword;

// generate 8 digit reandom password
const genrenpass = (): string => {
  const length = 8;
  const charset =
    "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$&_()%";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};
