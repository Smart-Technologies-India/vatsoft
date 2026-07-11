"use server";

import { getCurrentRefineryId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { tin_number_master } from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

const GetRefineryDealerTinNumbers = async (): Promise<
  ApiResponseType<tin_number_master[]>
> => {
  const functionname = GetRefineryDealerTinNumbers.name;

  try {
    const currentRefineryId = await getCurrentRefineryId();

    if (!currentRefineryId) {
      return createResponse({
        message: "Not authenticated. Please login.",
        functionname,
        data: [],
      });
    }

    // Get all dealers mapped to current refinery
    const refineryDealers = await prisma.refinery_dealer.findMany({
      where: {
        refineryId: currentRefineryId,
        deletedAt: null,
      },
      include: {
        dvat: {
          include: {
            tin_master: true,
          },
        },
      },
    });

    if (!refineryDealers || refineryDealers.length === 0) {
      return createResponse({
        message: "No dealers found for current refinery.",
        functionname,
        data: [],
      });
    }

    // Extract TIN numbers from dealers
    const tinIds = refineryDealers.map((dealer) => dealer.dvat.tin_master_id);
    
    const tinNumbers = await prisma.tin_number_master.findMany({
      where: {
        id: {
          in: tinIds,
        },
        deletedAt: null,
      },
    });

    return createResponse({
      message: "Refinery dealer TIN numbers fetched successfully.",
      functionname,
      data: tinNumbers,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
      data: [],
    });
  }
};

export default GetRefineryDealerTinNumbers;
