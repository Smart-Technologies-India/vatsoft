"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { RefineryDealerWithDealer } from "./types";

const GetUserRefineryDealer = async (): Promise<
  ApiResponseType<RefineryDealerWithDealer[] | null>
> => {
  const functionname = GetUserRefineryDealer.name;

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

    const refinery = await prisma.refinery.findFirst({
      where: {
        createdById: currentUserId,
        deletedAt: null,
      },
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
      },
    });

    if (!refinery) {
      return createResponse({
        message: "No refinery profile found for this account.",
        functionname,
      });
    }

    const dealerRows = await prisma.refinery_dealer.findMany({
      where: {
        refineryId: refinery.id,
        deletedAt: null,
        status: "ACTIVE",
      },
      include: {
        dvat: {
          include: {
            tin_master: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    return createResponse({
      message: "Refinery dealer entries fetched successfully.",
      functionname,
      data: dealerRows,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetUserRefineryDealer;
