"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { hash, compare } from "bcrypt";
import { user } from "@prisma/client";
import prisma from "../../../prisma/database";

interface ChangePasswordPayload {
  id: number;
  password: string;
}

const ChangePassword = async (
  payload: ChangePasswordPayload
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = ChangePassword.name;

  try {
    const user = await prisma.user.findFirst({
      where: { id: parseInt(payload.id.toString() ?? "0"), status: "ACTIVE" },
    });

    if (!user) {
      return createResponse({
        functionname,
        message: "user not exists. Please try again.",
      });
    }

    const ispasswordmatch = await compare(
      payload.password,
      user.password ?? ""
    );

    if (ispasswordmatch) {
      return createResponse({
        functionname,
        message: "You can't use the old password",
      });
    }

    const newpassword = await hash(payload.password, 10);

    const updatedUser = await prisma.user.update({
      where: {
        id: parseInt(payload.id.toString() ?? "0"),
      },
      data: {
        password: newpassword,
      },
    });

    if (!updatedUser) {
      return createResponse({
        message: "User not created",
        functionname,
      });
    }

    return createResponse({
      message: "User password updated successfully",
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default ChangePassword;
