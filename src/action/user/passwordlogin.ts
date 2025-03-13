"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { user } from "@prisma/client";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";
import { compare } from "bcrypt";

interface PasswordLoginPayload {
  tin_number: string;
  password: string;
}

const PasswordLogin = async (
  payload: PasswordLoginPayload
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = PasswordLogin.name;

  try {
    const usersresponse = await prisma.dvat04.findFirst({
      where: {
        OR: [
          {
            status: "APPROVED",
          },
          {
            status: "VERIFICATION",
          },
          {
            status: "PENDINGPROCESSING",
          },
        ],
        deletedAt: null,
        tinNumber: payload.tin_number,
      },
      include: {
        createdBy: true,
      },
    });

    if (!usersresponse) {
      return createResponse({
        message: "Wrong Credentials. Please try again.",
        functionname,
      });
    }

    // if (usersresponse.status === "PENDINGPROCESSING") {
    //   return createResponse({
    //     message:
    //       "Your DVAT is submitted for processing. Kindly wait for approval.",
    //     functionname,
    //   });
    // }

    const passwordMatch = await compare(
      payload.password,
      usersresponse.createdBy.password ?? ""
    );
    if (!passwordMatch) {
      return createResponse({
        message: "Wrong Credentials. Please try again.",
        functionname,
      });
    }

    cookies().set("id", usersresponse.createdBy.id.toString());
    cookies().set("role", usersresponse.createdBy.role.toString());
    cookies().set("dvat", usersresponse.id.toString());

    return createResponse({
      message: "Tin Login Successful",
      functionname,
      data: usersresponse.createdBy,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default PasswordLogin;
