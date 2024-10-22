"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { Role, SelectOffice, user } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetDeptUserPayload {
  role: Role;
  dept: SelectOffice;
}

const GetDeptUser = async (
  payload: GetDeptUserPayload
): Promise<ApiResponseType<user | null>> => {
  const functionname: string = GetDeptUser.name;

  try {
    const user = await prisma.user.findFirst({
      where: {
        role: payload.role,
        selectOffice: payload.dept,
        status: "ACTIVE",
        deletedAt: null,
      },
    });

    if (!user) {
      return createResponse({
        message: "User not exist.",
        functionname,
      });
    }

    return createResponse({
      message: "User get successfully",
      functionname: functionname,
      data: user,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetDeptUser;
