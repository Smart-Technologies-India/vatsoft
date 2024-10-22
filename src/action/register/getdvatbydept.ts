"use server";
interface GetAllDvatByDeptPayload {
  dept: SelectOffice;
}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { SelectOffice } from "@prisma/client";

const GetAllDvatByDept = async (
  payload: GetAllDvatByDeptPayload
): Promise<ApiResponseType<any[] | null>> => {
  const functionname: string = GetAllDvatByDept.name;
  try {
    const dvat04response = await prisma.dvat04.findMany({
      where: {
        selectOffice: payload.dept,
        NOT: [
          {
            status: "NONE",
          },
        ],
      },
      include: {
        registration: {
          include: {
            dept_user: true,
          },
        },
      },
    });

    if (!dvat04response) {
      return createResponse({
        message: "Invalid id. Please try again.",
        functionname,
      });
    }

    return {
      status: true,
      data: dvat04response,
      message: "dvat04 data get successfully",
      functionname: "GetAllDvat",
    };
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAllDvatByDept;
