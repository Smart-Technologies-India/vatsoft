"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { challan, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetDeptChallanPayload {
  dept: SelectOffice;
}

const GetDeptChallan = async (
  payload: GetDeptChallanPayload
): Promise<ApiResponseType<challan[] | null>> => {
  const functionname: string = GetDeptChallan.name;

  try {
    const challan = await prisma.challan.findMany({
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
      message: challan
        ? "All Challan Get successfully"
        : "Unable to get challan.",
      functionname: functionname,
      data: challan ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetDeptChallan;
