"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { RefineryDealerWithDealer } from "./types";

interface CreateRefineryDealerPayload {
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

const CreateRefineryDealer = async (
  payload: CreateRefineryDealerPayload,
): Promise<ApiResponseType<RefineryDealerWithDealer | null>> => {
  const functionname = CreateRefineryDealer.name;

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

    const existing = await prisma.refinery_dealer.findFirst({
      where: {
        refineryId: refinery.id,
        dealerId: payload.dealerId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return createResponse({
        message: "Dealer is already mapped to this refinery.",
        functionname,
      });
    }

    const created = await prisma.refinery_dealer.create({
      data: {
        refineryId: refinery.id,
        dealerId: payload.dealerId,
        tanker_1: sanitizeTanker(payload.tanker_1),
        tanker_2: sanitizeTanker(payload.tanker_2),
        tanker_3: sanitizeTanker(payload.tanker_3),
        tanker_4: sanitizeTanker(payload.tanker_4),
        tanker_5: sanitizeTanker(payload.tanker_5),
        createdById: currentUserId,
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
      message: "Refinery dealer created successfully.",
      functionname,
      data: created,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default CreateRefineryDealer;
