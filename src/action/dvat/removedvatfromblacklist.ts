"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { getCurrentUserId } from "@/lib/auth";

interface RemoveDvatFromBlacklistPayload {
  blacklistId: number;
}

interface RemoveDvatFromBlacklistResponse {
  status: boolean;
  message: string;
  data?: any;
}

const RemoveDvatFromBlacklist = async (
  payload: RemoveDvatFromBlacklistPayload,
): Promise<RemoveDvatFromBlacklistResponse> => {
  const functionname: string = RemoveDvatFromBlacklist.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        message: "Not authenticated. Please login.",
      };
    }

    // Soft delete the redflag entry
    const result = await prisma.dvatblock.update({
      where: { id: payload.blacklistId },
      data: {
        deleted_at: new Date(),
      },
    });

    return {
      status: true,
      message: "DVAT removed from redflag successfully.",
      data: result,
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
    };
  }
};

export default RemoveDvatFromBlacklist;
