"use server";
interface GetTempRegNumberPayload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { getCurrentDvatId } from "@/lib/auth";

const GetAllUserDvat = async (
  payload: GetTempRegNumberPayload
): Promise<ApiResponseType<any[] | null>> => {
  const functionname: string = GetAllUserDvat.name;

  const dvatid = await getCurrentDvatId();

  if (dvatid == null || dvatid == undefined) {
    return createResponse({
      message: "Invalid id. Please try again.",
      functionname,
    });
  }

  try {
    const dvatresponse = await prisma.dvat04.findMany({
      where: {
        id: dvatid,

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
