"use server";
import { getCurrentUserId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { refinery } from "@prisma/client";
import prisma from "../../../prisma/database";

const getAllRefineryTinNumberMaster = async (): Promise<
  ApiResponseType<refinery[] | null>
> => {
  const functionname: string = getAllRefineryTinNumberMaster.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const tinNumbers = await prisma.refinery.findMany({
      where: {
        status: "APPROVED",
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

export default getAllRefineryTinNumberMaster;
