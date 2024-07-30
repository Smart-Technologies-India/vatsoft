"use server";
interface UserToDvat04Payload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../../prisma/database";

const UserToDvat04 = async (
  payload: UserToDvat04Payload
): Promise<ApiResponseType<dvat04 | null>> => {
  try {
    const dvat04 = await prisma.registration.findFirst({
      where: {
        userId: parseInt(payload.userid.toString()),
        deletedAt: null,
        deletedById: null,
      },
      include: {
        dvat04: true,
      },
    });

    if (!dvat04)
      return {
        status: false,
        data: null,
        message: "Unable to add Temp registration number. Please try again.",
        functionname: "UserToDvat04",
      };

    return {
      status: true,
      data: dvat04.dvat04[0],
      message: "dvat04 data get successfully",
      functionname: "UserToDvat04",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "UserToDvat04",
    };
    return response;
  }
};

export default UserToDvat04;
