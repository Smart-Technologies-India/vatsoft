"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { breakage } from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface CreateBreakagePayload {
  dvatid: number;
  commodityid: number;
  quantity: number;
}

const CRATE_BASED_COMMODITIES = new Set([
  "OIDC",
  "WHOLESALER",
  "MANUFACTURER",
]);

const CreateBreakage = async (
  payload: CreateBreakagePayload,
): Promise<ApiResponseType<breakage | null>> => {
  const functionname: string = CreateBreakage.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "CreateBreakage",
      } as any;
    }

    if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
      return createResponse({
        message: "Quantity must be greater than zero.",
        functionname,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const dvatRecord = await tx.dvat04.findFirst({
        where: {
          id: payload.dvatid,
          deletedAt: null,
          deletedById: null,
        },
        select: {
          id: true,
          commodity: true,
        },
      });

      if (!dvatRecord) {
        throw new Error("DVAT record not found.");
      }

      const commodityRecord = await tx.commodity_master.findFirst({
        where: {
          id: payload.commodityid,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
        },
        select: {
          id: true,
          crate_size: true,
        },
      });

      if (!commodityRecord) {
        throw new Error("Commodity not found.");
      }

      const dvatCommodity = String(dvatRecord.commodity ?? "");
      const isCrateBased = CRATE_BASED_COMMODITIES.has(dvatCommodity);

      let quantityInPcs = Math.trunc(payload.quantity);
      if (quantityInPcs <= 0) {
        throw new Error("Quantity must be greater than zero.");
      }

      if (isCrateBased) {
        if (!commodityRecord.crate_size || commodityRecord.crate_size <= 0) {
          throw new Error("Crate size is not configured for this commodity.");
        }
        quantityInPcs = quantityInPcs * commodityRecord.crate_size;
      }

      const stockRow = await tx.stock.findFirst({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          dvat04Id: payload.dvatid,
          commodity_masterId: payload.commodityid,
        },
      });

      if (!stockRow) {
        throw new Error("Stock not found for selected commodity.");
      }

      if (stockRow.quantity < quantityInPcs) {
        throw new Error(
          `Insufficient stock. Available ${stockRow.quantity} pcs, required ${quantityInPcs} pcs.`,
        );
      }

      await tx.stock.update({
        where: { id: stockRow.id },
        data: {
          quantity: stockRow.quantity - quantityInPcs,
          updatedById: currentUserId,
        },
      });

      const breakageRow = await tx.breakage.create({
        data: {
          dvat04Id: payload.dvatid,
          commodity_masterId: payload.commodityid,
          quantity: quantityInPcs,
          createdById: currentUserId,
          updatedById: currentUserId,
        },
      });

      return breakageRow;
    });

    return createResponse({
      message: "Breakage added successfully.",
      functionname,
      data: result,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateBreakage;
