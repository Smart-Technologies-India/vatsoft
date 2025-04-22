"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { tin_number_master } from "@prisma/client";
import prisma from "../../../prisma/database";

const getAllTinNumberMaster = async (): Promise<ApiResponseType<tin_number_master[] | null>> => {
  const functionname: string = getAllTinNumberMaster.name;

  try {
    const tinNumbers = await prisma.tin_number_master.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return createResponse({
      message: "All TIN numbers retrieved successfully.",
      functionname,
      data: tinNumbers,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default getAllTinNumberMaster;