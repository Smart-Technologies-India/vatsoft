"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { hash, compare } from "bcrypt";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

interface DvatChangePasswordPayload {
  id: number;
  password: string;
}

const DvatChangePassword = async (
  payload: DvatChangePasswordPayload
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = DvatChangePassword.name;

  try {
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
      dvat.password ?? ""
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
      },
    });

    if (!updatedDvat) {
      return createResponse({
        message: "Dvat not created",
        functionname,
      });
    }

    return createResponse({
      message: "Dvat password updated successfully",
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
