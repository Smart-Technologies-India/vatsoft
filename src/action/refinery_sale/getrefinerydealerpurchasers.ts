"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { refinery } from "@prisma/client";

const GetRefineryDealerPurchasers = async (): Promise<
  ApiResponseType<refinery[] | null>
> => {
  const functionname = GetRefineryDealerPurchasers.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const mappedDealers = await prisma.refinery_dealer.findMany({
      where: {
        dealerId: currentDvatId,
        deletedAt: null,
        status: "ACTIVE",
        dvat: {
          deletedAt: null,
          status: "APPROVED",
        },
      },
      include: {
        refinery: true,
        dvat: {
          include: {
            tin_master: {
              select: {
                tin_number: true,
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    const refinery_data: refinery[] = mappedDealers.map(
      (item) => item.refinery,
    );

    return createResponse({
      message: "Refinery dealer purchasers fetched successfully.",
      functionname,
      data: refinery_data,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetRefineryDealerPurchasers;
