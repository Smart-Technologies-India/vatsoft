"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { refunds, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetDeptRefundsPayload {
  dept: SelectOffice;
}

const GetDeptRefunds = async (
  payload: GetDeptRefundsPayload
): Promise<ApiResponseType<refunds[] | null>> => {
  const functionname: string = GetDeptRefunds.name;

  try {
    const refunds_response = await prisma.refunds.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        dvat: {
          selectOffice: payload.dept,
        },
      },
    });

    return createResponse({
      message: refunds_response
        ? "All refunds Get successfully"
        : "Unable to get refunds.",
      functionname: functionname,
      data: refunds_response ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetDeptRefunds;
