"use server";
interface UserStatusPayload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { getCurrentDvatId } from "@/lib/auth";

type Response = {
  user: boolean;
  registration: boolean;
};

const GetUserStatus = async (
  payload: UserStatusPayload
): Promise<ApiResponseType<Response | null>> => {
  const functionname: string = GetUserStatus.name;

  const dvatid = await getCurrentDvatId();

  if (dvatid == null || dvatid == undefined) {
    return createResponse({
      message: "Invalid id. Please try again.",
      functionname,
    });
  }

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
        },
        message: "Invalid user id. Please try again.",
        functionname: "GetUser",
      };

    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        id: dvatid,
        deletedAt: null,
        deletedById: null,
        status: "APPROVED",
      },
    });

    if (!dvat04) {
      return createResponse({
        message: "Invalid register id. Please try again.",
        functionname,
        data: {
          user: true,
          registration: false,
        },
      });
    }

    return createResponse({
      message: "User data get successfully",
      functionname,
      data: {
        user: true,
        registration: true,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetUserStatus;
