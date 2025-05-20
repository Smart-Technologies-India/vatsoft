"use server";
interface GetUserLastPandingReturnPayload {
  userid: number;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { return_filing } from "@prisma/client";
import prisma from "../../../prisma/database";
import { cookies } from "next/headers";

const GetUserLastPandingReturn = async (
  payload: GetUserLastPandingReturnPayload
): Promise<ApiResponseType<return_filing | null>> => {
  const functionname: string = GetUserLastPandingReturn.name;

  try {
    const dvatid = cookies().get("dvat")?.value;
    if (!dvatid) {
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });
    }
    const dvat04response = await prisma.dvat04.findFirst({
      where: {
        deletedAt: null,
        deletedBy: null,
        // createdById: payload.userid,
        id: parseInt(dvatid),
        status: "APPROVED",
      },
    });

    if (!dvat04response)
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });

    const response = await prisma.return_filing.findFirst({
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

    if (!response) {
      // return createResponse({
      //   message: "No Pending user return found.",
      //   functionname,
      // });

      const response = await prisma.return_filing.findFirst({
        where: {
          dvatid: dvat04response.id,
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
        },
        orderBy: {
          due_date: "desc",
        },
      });

      if (!response) {
        return createResponse({
          message: "No Pending user return found.",
          functionname,
        });
      }

      return createResponse({
        message: "No Pending user return found.",
        functionname,
        data: response,
      });
    }

    return createResponse({
      message: "dvat04 data get successfully",
      functionname,
      data: response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetUserLastPandingReturn;
