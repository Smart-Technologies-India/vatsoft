"use server";
interface GetTempRegNumberPayload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04, user } from "@prisma/client";
import prisma from "../../../prisma/database";
import { cookies } from "next/headers";

const GetAllUserDvat = async (
  payload: GetTempRegNumberPayload
): Promise<ApiResponseType<any[] | null>> => {
  const functionname: string = GetAllUserDvat.name;
  const dvatid = cookies().get("dvat")?.value;
  if (!dvatid) {
    return createResponse({
      message: "Invalid id. Please try again.",
      functionname,
    });
  }
  try {
    const dvatresponse = await prisma.dvat04.findMany({
      where: {
        id: parseInt(dvatid),

        createdById: parseInt(payload.userid.toString() ?? "0"),
        NOT: [
          {
            status: "NONE",
          },
        ],
        deletedAt: null,
        deletedById: null,
      },
      include: {
        registration: {
          include: {
            dept_user: true,
          },
        },
      },
    });

    if (!dvatresponse)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    return createResponse({
      data: dvatresponse,
      message: "dvat04 data get successfully",
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAllUserDvat;
