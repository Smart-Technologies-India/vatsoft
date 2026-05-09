"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface GetPurchaseDeleteImpactPayload {
  id: number;
}

interface PurchaseDeleteImpact {
  creditNoteCount: number;
  debitNoteCount: number;
  totalLinkedCount: number;
}

const GetPurchaseDeleteImpact = async (
  payload: GetPurchaseDeleteImpactPayload,
): Promise<ApiResponseType<PurchaseDeleteImpact | null>> => {
  const functionname: string = GetPurchaseDeleteImpact.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetPurchaseDeleteImpact",
      } as any;
    }

    const purchase = await prisma.daily_purchase.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        status: "ACTIVE",
      },
      select: {
        urn_number: true,
      },
    });

    if (!purchase) {
      return createResponse({
        message: "Purchase entry not found.",
        functionname,
      });
    }

    if (!purchase.urn_number) {
      return createResponse({
        message: "No linked return entries found.",
        functionname,
        data: {
          creditNoteCount: 0,
          debitNoteCount: 0,
          totalLinkedCount: 0,
        },
      });
    }

    const [creditNoteCount, debitNoteCount] = await Promise.all([
      prisma.returns_entry.count({
        where: {
          description_of_goods: purchase.urn_number,
          category_of_entry: "CREDIT_NOTE",
          deletedAt: null,
          status: "ACTIVE",
        },
      }),
      prisma.returns_entry.count({
        where: {
          description_of_goods: purchase.urn_number,
          category_of_entry: "DEBIT_NOTE",
          deletedAt: null,
          status: "ACTIVE",
        },
      }),
    ]);

    return createResponse({
      message: "Delete impact fetched successfully.",
      functionname,
      data: {
        creditNoteCount,
        debitNoteCount,
        totalLinkedCount: creditNoteCount + debitNoteCount,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetPurchaseDeleteImpact;
