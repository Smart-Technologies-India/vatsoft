"use server";
interface GetUserLastPandingReturnPayload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { return_filing } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetUserLastPandingReturn = async (
  payload: GetUserLastPandingReturnPayload
): Promise<ApiResponseType<return_filing | null>> => {
  const functionname: string = GetUserLastPandingReturn.name;

  try {
    const dvat04response = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        createdById: payload.userid,
        status: "APPROVED",
      },
    });

    if (!dvat04response)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    const respose = await prisma.return_filing.findFirst({
      where: {
        dvatid: dvat04response.id,
        filing_status: true,
        filing_date: {
          not: null,
        },
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
      },
      orderBy: {
        due_date: "desc",
      },
    });


    if (!respose) {
      return createResponse({
        message: "No Pending user return found.",
        functionname,
      });
    }

    return createResponse({
      message: "dvat04 data get successfully",
      functionname,
      data: respose,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetUserLastPandingReturn;
