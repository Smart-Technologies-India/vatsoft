"use server";

import { getCurrentDvatId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { tin_number_master } from "@prisma/client";
import prisma from "../../../prisma/database";

const GetCurrentDvatTin = async (): Promise<
  ApiResponseType<tin_number_master | null>
> => {
  const functionname: string = GetCurrentDvatTin.name;

  try {
    const currentDvatId = await getCurrentDvatId();

    if (!currentDvatId) {
      return createResponse({
        message: "Not authenticated. Please login.",
        functionname,
      });
    }

    // Get DVAT record with its tin_master
    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        id: currentDvatId,
        status: "APPROVED",
        deletedAt: null,
      },
      include: {
        tin_master: true,
      },
    });

    if (!dvat04 || !dvat04.tin_master) {
      return createResponse({
        message: "DVAT profile or TIN master not found.",
        functionname,
      });
    }

    return createResponse({
      message: "DVAT TIN fetched successfully.",
      functionname,
      data: dvat04.tin_master,
    });
  } catch (error) {
    return createResponse({
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch DVAT TIN.",
      functionname,
    });
  }
};

export default GetCurrentDvatTin;
