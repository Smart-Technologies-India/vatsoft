"use server";
interface IsRegisterPedningPayload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

const IsRegisterPedning = async (
  payload: IsRegisterPedningPayload
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = IsRegisterPedning.name;
  try {
    const dvat04response = await prisma.dvat04.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        createdById: payload.userid,
        OR: [
          {
            status: "CLARIFICATINFILED",
          },
          {
            status: "CLARIFICATIONNOTFILED",
          },
          {
            status: "PENDINGCLARIFICATION",
          },
          {
            status: "PENDINGPROCESSING",
          },
          {
            status: "VERIFICATION",
          },
        ],
      },
    });

    if (!dvat04response)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    if (dvat04response.length > 0) {
      return createResponse({
        message: "Pending request already exist try again.",
        functionname,
        data: true,
      });
    }
    return createResponse({
      message: "dvat04 data get successfully",
      functionname,
      data: false,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default IsRegisterPedning;
