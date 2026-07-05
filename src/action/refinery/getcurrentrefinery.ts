"use server";

import { getCurrentRefineryId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { refinery } from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

const GetCurrentRefinery = async (): Promise<
  ApiResponseType<refinery | null>
> => {
  const functionname = GetCurrentRefinery.name;

  try {
    const currentRefineryId = await getCurrentRefineryId();

    if (!currentRefineryId) {
      return createResponse({
        message: "Not authenticated. Please login.",
        functionname,
      });
    }

    const refinery_data = await prisma.refinery.findFirst({
      where: {
        id: currentRefineryId,
        deletedAt: null,
      },
    });

    if (!refinery_data) {
      return createResponse({
        message: "Refinery profile not found.",
        functionname,
      });
    }

    return createResponse({
      message: "Refinery fetched successfully.",
      functionname,
      data: refinery_data,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
      data: null,
    });
  }
};

export default GetCurrentRefinery;
