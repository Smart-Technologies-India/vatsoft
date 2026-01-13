"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { cookies } from "next/headers";
import prisma from "../../../prisma/database";
import { compare } from "bcrypt";
import { user } from "../../../generated/prisma/client";
import { generateToken } from "@/lib/jwt";

interface DvatPasswordLoginPayload {
  tin_number: string;
  password: string;
}

const DvatPasswordLogin = async (
  payload: DvatPasswordLoginPayload
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = DvatPasswordLogin.name;
  const cookie = await cookies();
  try {
    const dvatresponse = await prisma.dvat04.findFirst({
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

    if (!dvatresponse) {
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
      dvatresponse.password ?? ""
    );

    if (!passwordMatch) {
      return createResponse({
        message: "Wrong Credentials. Please try again.",
        functionname,
      });
    }

    const token = generateToken({
      userId: dvatresponse.createdBy.id,
      mobile: dvatresponse.createdBy.mobileOne ?? "",
      role: dvatresponse.createdBy.role,
      dvatid: dvatresponse.id,
    });

    // Set httpOnly secure cookie
    cookie.set("auth_token", token, {
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: process.env.NODE_ENV === "production", // Only over HTTPS in production
      sameSite: "strict", // CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // cookie.set("id", usersresponse.createdBy.id.toString());
    // cookie.set("role", usersresponse.createdBy.role.toString());
    // cookie.set("dvat", usersresponse.id.toString());

    return createResponse({
      message: "Tin Login Successful",
      functionname,
      data: dvatresponse.createdBy,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default DvatPasswordLogin;
