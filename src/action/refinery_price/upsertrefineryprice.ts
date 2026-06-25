"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

const ALLOWED_COMMODITY_IDS = [1, 2, 748, 749];

interface AddRefineryDayPricePayload {
  dvatId: number;
  commodityMasterId: number;
  price: number;
  effectiveDate: string;
}

const AddRefineryDayPrice = async (
  payload: AddRefineryDayPricePayload,
): Promise<ApiResponseType<boolean | null>> => {
  const functionname = AddRefineryDayPrice.name;

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

    if (!payload.commodityMasterId || payload.commodityMasterId <= 0) {
      return createResponse({
        message: "Commodity is required.",
        functionname,
      });
    }

    if (!payload.dvatId || payload.dvatId <= 0) {
      return createResponse({
        message: "Dealer is required.",
        functionname,
      });
    }

    if (!Number.isFinite(payload.price) || payload.price <= 0) {
      return createResponse({
        message: "Price must be a positive number.",
        functionname,
      });
    }

    if (!payload.effectiveDate) {
      return createResponse({
        message: "Effective date is required.",
        functionname,
      });
    }

    const refinery = await prisma.refinery.findFirst({
      where: {
        deletedAt: null,
        createdById: currentUserId,
      },
      orderBy: { id: "desc" },
      select: { id: true },
    });

    if (!refinery) {
      return createResponse({
        message: "No refinery profile found for this account.",
        functionname,
      });
    }

    const mappedDealer = await prisma.refinery_dealer.findFirst({
      where: {
        refineryId: refinery.id,
        dealerId: payload.dvatId,
        deletedAt: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

    if (!mappedDealer) {
      return createResponse({
        message: "Selected dealer is not mapped in refinery dealer master.",
        functionname,
      });
    }

    const commodity = await prisma.commodity_master.findFirst({
      where: {
        AND: [
          {
            id: payload.commodityMasterId,
          },
          {
            id: {
              in: ALLOWED_COMMODITY_IDS,
            },
          },
        ],
        deletedAt: null,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (!commodity) {
      return createResponse({
        message: "Invalid commodity selected.",
        functionname,
      });
    }

    const effectiveDate = new Date(payload.effectiveDate);
    if (Number.isNaN(effectiveDate.getTime())) {
      return createResponse({
        message: "Invalid effective date.",
        functionname,
      });
    }
    // Save every selected date at 12 midnight (00:00:00).
    effectiveDate.setHours(0, 0, 0, 0);

    const existing = await prisma.refinery_price.findFirst({
      where: {
        refineryId: refinery.id,
        dvatid: payload.dvatId,
        commodity_masterId: payload.commodityMasterId,
        effective_date: effectiveDate,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      // return createResponse({
      //   message: "Today's price is already added for this commodity.",
      //   functionname,
      // });
      await prisma.refinery_price.update({
        where: { id: existing.id },
        data: {
          price: payload.price.toFixed(2),
          updatedById: currentUserId,
        },
      });
    }

    await prisma.refinery_price.create({
      data: {
        refineryId: refinery.id,
        dvatid: payload.dvatId,
        commodity_masterId: payload.commodityMasterId,
        price: payload.price.toFixed(2),
        effective_date: effectiveDate,
        status: "ACTIVE",
        createdById: currentUserId,
      },
    });

    return createResponse({
      message: "Price added successfully.",
      functionname,
      data: true,
    });
  } catch (e) {
    return createResponse({ message: errorToString(e), functionname });
  }
};

export default AddRefineryDayPrice;
