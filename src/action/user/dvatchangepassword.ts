"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { hash, compare } from "bcrypt";
import prisma from "../../../prisma/database";

interface DvatChangePasswordPayload {
  id: number;
  password: string;
}

const DvatChangePassword = async (
  payload: DvatChangePasswordPayload,
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = DvatChangePassword.name;

  try {
    // const currentUserId = await getCurrentUserId();
    // const currentDvatId = await getCurrentDvatId();
    // if (!currentUserId || !currentDvatId) {
    //   return {
    //     status: false,
    //     data: null,
    //     message: "Not authenticated. Please login.",
    //     functionname: "DvatChangePassword",
    //   } as any;
    // }

    const dvat = await prisma.dvat04.findFirst({
      where: { id: parseInt(payload.id.toString() ?? "0"), deletedAt: null },
    });

    if (!dvat) {
      return createResponse({
        functionname,
        message: "Dvat not exists. Please try again.",
      });
    }

    const ispasswordmatch = await compare(
      payload.password,
      dvat.password ?? "",
    );

    if (ispasswordmatch) {
      return createResponse({
        functionname,
        message: "You can't use the old password",
      });
    }

    const newpassword = await hash(payload.password, 10);

    const updatedDvat = await prisma.dvat04.update({
      where: {
        id: parseInt(payload.id.toString() ?? "0"),
      },
      data: {
        password: newpassword,
        temppass: payload.password,
      },
    });

    if (!updatedDvat) {
      return createResponse({
        message: "Password update failed. Please try again.",
        functionname,
      });
    }

    return createResponse({
      data: true,
      message: "Password updated successfully",
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default DvatChangePassword;
