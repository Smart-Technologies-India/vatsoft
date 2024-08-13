"use server";
interface UserStatusPayload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";

type Response = {
  user: boolean;
  registration: boolean;
  dvat: boolean;
};

const UserStatus = async (
  payload: UserStatusPayload
): Promise<ApiResponseType<Response | null>> => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: parseInt(payload.id.toString() ?? "0"), status: "ACTIVE" },
    });

    if (!user)
      return {
        status: false,
        data: {
          user: false,
          registration: false,
          dvat: false,
        },
        message: "Invalid user id. Please try again.",
        functionname: "GetUser",
      };

    const registration = await prisma.registration.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        status: "ACTIVE",
        userId: user.id,
      },
    });

    if (!registration)
      return {
        status: false,
        data: {
          user: true,
          registration: false,
          dvat: false,
        },
        message: "Invalid register id. Please try again.",
        functionname: "GetUser",
      };

    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        registrationId: registration.id,
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!dvat04)
      return {
        status: false,
        data: {
          user: true,
          registration: false,
          dvat: false,
        },
        message: "Invalid register id. Please try again.",
        functionname: "GetUser",
      };

    return {
      status: true,
      data: {
        user: true,
        registration: true,
        dvat: true,
      },
      message: "User data get successfully",
      functionname: "GetUser",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetUser",
    };
    return response;
  }
};

export default UserStatus;
