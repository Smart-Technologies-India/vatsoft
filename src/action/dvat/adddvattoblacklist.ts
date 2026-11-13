"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { getCurrentUserId } from "@/lib/auth";

interface AddDvatToBlacklistPayload {
  dvatId: number;
}

interface AddDvatToBlacklistResponse {
  status: boolean;
  message: string;
  data?: any;
}

const AddDvatToBlacklist = async (
  payload: AddDvatToBlacklistPayload,
): Promise<AddDvatToBlacklistResponse> => {
  const functionname: string = AddDvatToBlacklist.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        message: "Not authenticated. Please login.",
      };
    }

    // Fetch the DVAT04 record
    const dvat = await prisma.dvat04.findUnique({
      where: { id: payload.dvatId },
      select: {
        id: true,
        tinNumber: true,
        tradename: true,
        commodity: true,
        selectOffice: true,
        frequencyFilings: true,
      },
    });

    if (!dvat) {
      return {
        status: false,
        message: "DVAT record not found.",
      };
    }

    // Check if already blacklisted
    const existingBlacklist = await prisma.dvatblock.findFirst({
      where: {
        dvatId: payload.dvatId,
        deleted_at: null,
      },
    });

    if (existingBlacklist) {
      return {
        status: false,
        message: "This DVAT is already blacklisted.",
      };
    }

    // Create redflag entry
    const blacklistEntry = await prisma.dvatblock.create({
      data: {
        dvatId: payload.dvatId,
        office: dvat.selectOffice || "Dadra_Nagar_Haveli",
        tinnumber: dvat.tinNumber,
        tradename: dvat.tradename,
        commodity: dvat.commodity,
        frequency: dvat.frequencyFilings,
      },
    });

    return {
      status: true,
      message: "DVAT added to redflag successfully.",
      data: blacklistEntry,
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
    };
  }
};

export default AddDvatToBlacklist;
