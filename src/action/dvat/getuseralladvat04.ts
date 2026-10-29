"use server";
import { getCurrentUserId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetUserAllDvat04Payload {}

const GetUserAllDvat04 = async (
  payload: GetUserAllDvat04Payload
): Promise<ApiResponseType<dvat04[] | null>> => {
  const functionname: string = GetUserAllDvat04.name;

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

    // Fetch DVATs that are not deleted (status check removed to get all available DVATs)
    const dvat04response = await prisma.dvat04.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
      },
      orderBy: {
        tradename: "asc",
      },
    });

    return createResponse({
      message: "All DVAT04 data fetched successfully",
      functionname,
      data: dvat04response && dvat04response.length > 0 ? dvat04response : null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetUserAllDvat04;
