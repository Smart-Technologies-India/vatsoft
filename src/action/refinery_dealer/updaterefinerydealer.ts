"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { RefineryDealerWithDealer } from "./types";

interface UpdateRefineryDealerPayload {
  id: number;
  dealerId: number;
  tanker_1?: string;
  tanker_2?: string;
  tanker_3?: string;
  tanker_4?: string;
  tanker_5?: string;
}

const sanitizeTanker = (value?: string): string | null => {
  const cleaned = (value || "").trim();
  return cleaned.length ? cleaned : null;
};

const UpdateRefineryDealer = async (
  payload: UpdateRefineryDealerPayload,
): Promise<ApiResponseType<RefineryDealerWithDealer | null>> => {
  const functionname = UpdateRefineryDealer.name;

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

    if (!Number.isInteger(payload.id) || payload.id <= 0) {
      return createResponse({
        message: "Invalid mapping id.",
        functionname,
      });
    }

    if (!Number.isInteger(payload.dealerId) || payload.dealerId <= 0) {
      return createResponse({
        message: "Dealer is required.",
        functionname,
      });
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

    const existing = await prisma.refinery_dealer.findFirst({
      where: {
        id: payload.id,
        refineryId: refinery.id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return createResponse({
        message: "Refinery dealer entry not found.",
        functionname,
      });
    }

    const dealer = await prisma.dvat04.findFirst({
      where: {
        id: payload.dealerId,
        deletedAt: null,
        status: "APPROVED",
      },
      select: {
        id: true,
      },
    });

    if (!dealer) {
      return createResponse({
        message: "Selected dealer is not valid.",
        functionname,
      });
    }

    const duplicate = await prisma.refinery_dealer.findFirst({
      where: {
        refineryId: refinery.id,
        dealerId: payload.dealerId,
        deletedAt: null,
        NOT: {
          id: payload.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicate) {
      return createResponse({
        message: "Dealer is already mapped to this refinery.",
        functionname,
      });
    }

    const updated = await prisma.refinery_dealer.update({
      where: {
        id: payload.id,
      },
      data: {
        dealerId: payload.dealerId,
        tanker_1: sanitizeTanker(payload.tanker_1),
        tanker_2: sanitizeTanker(payload.tanker_2),
        tanker_3: sanitizeTanker(payload.tanker_3),
        tanker_4: sanitizeTanker(payload.tanker_4),
        tanker_5: sanitizeTanker(payload.tanker_5),
        updatedById: currentUserId,
      },
      include: {
        dvat: {
          include: {
            tin_master: true,
          },
        },
      },
    });

    return createResponse({
      message: "Refinery dealer updated successfully.",
      functionname,
      data: updated,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default UpdateRefineryDealer;
