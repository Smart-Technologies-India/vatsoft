"use server";

import { getCurrentRefineryId, getCurrentUserId } from "@/lib/auth";
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
    const currentRefineryId = await getCurrentRefineryId();
    if (!currentUserId || !currentRefineryId) {
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
        id: currentRefineryId,
        deletedAt: null,
      },
      select: {
        id: true,
        tinNumber: true,
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
        dealerId: true,
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

    const targetRefineries = await prisma.refinery.findMany({
      where: {
        deletedAt: null,
        tinNumber: refinery.tinNumber,
      },
      select: {
        id: true,
      },
    });

    const sourceDealerId = existing.dealerId;

    await prisma.$transaction(async (tx) => {
      for (const targetRefinery of targetRefineries) {
        const oldRow = await tx.refinery_dealer.findFirst({
          where: {
            refineryId: targetRefinery.id,
            dealerId: sourceDealerId,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        });

        const newRow = await tx.refinery_dealer.findFirst({
          where: {
            refineryId: targetRefinery.id,
            dealerId: payload.dealerId,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        });

        if (oldRow) {
          if (
            payload.dealerId !== sourceDealerId &&
            newRow &&
            newRow.id !== oldRow.id
          ) {
            throw new Error(
              "Dealer is already mapped to one or more refinery entries with this TIN.",
            );
          }

          await tx.refinery_dealer.update({
            where: {
              id: oldRow.id,
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
          });

          continue;
        }

        if (newRow) {
          await tx.refinery_dealer.update({
            where: {
              id: newRow.id,
            },
            data: {
              tanker_1: sanitizeTanker(payload.tanker_1),
              tanker_2: sanitizeTanker(payload.tanker_2),
              tanker_3: sanitizeTanker(payload.tanker_3),
              tanker_4: sanitizeTanker(payload.tanker_4),
              tanker_5: sanitizeTanker(payload.tanker_5),
              updatedById: currentUserId,
            },
          });

          continue;
        }

        await tx.refinery_dealer.create({
          data: {
            refineryId: targetRefinery.id,
            dealerId: payload.dealerId,
            tanker_1: sanitizeTanker(payload.tanker_1),
            tanker_2: sanitizeTanker(payload.tanker_2),
            tanker_3: sanitizeTanker(payload.tanker_3),
            tanker_4: sanitizeTanker(payload.tanker_4),
            tanker_5: sanitizeTanker(payload.tanker_5),
            createdById: currentUserId,
            updatedById: currentUserId,
          },
        });
      }
    });

    const updated = await prisma.refinery_dealer.findFirst({
      where: {
        refineryId: refinery.id,
        dealerId: payload.dealerId,
        deletedAt: null,
      },
      include: {
        dvat: {
          include: {
            tin_master: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return createResponse({
      message: `Refinery dealer updated for ${targetRefineries.length} refinery entr${targetRefineries.length === 1 ? "y" : "ies"} with same TIN.`,
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
