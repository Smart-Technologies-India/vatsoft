"use server";
interface GetUserPayload {
  id: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import { user } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetUser = async (
  payload: GetUserPayload
): Promise<ApiResponseType<user | null>> => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: parseInt(payload.id.toString() ?? "0"), status: "ACTIVE" },
    });

    if (!user)
      return {
        status: false,
        data: null,
        message: "Invalid id. Please try again.",
        functionname: "GetUser",
      };

    return {
      status: true,
      data: user,
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

export default GetUser;
