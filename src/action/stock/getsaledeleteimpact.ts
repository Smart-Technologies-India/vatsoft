"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";

interface GetSaleDeleteImpactPayload {
  id: number;
}

interface SaleDeleteImpact {
  creditNoteCount: number;
  debitNoteCount: number;
  totalLinkedCount: number;
}

const GetSaleDeleteImpact = async (
  payload: GetSaleDeleteImpactPayload,
): Promise<ApiResponseType<SaleDeleteImpact | null>> => {
  const functionname: string = GetSaleDeleteImpact.name;

  try {
    const sale = await prisma.daily_sale.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        status: "ACTIVE",
      },
      select: {
        urn_number: true,
      },
    });

    if (!sale) {
      return createResponse({
        message: "Sale entry not found.",
        functionname,
      });
    }

    if (!sale.urn_number) {
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
          description_of_goods: sale.urn_number,
          category_of_entry: "CREDIT_NOTE",
          deletedAt: null,
          status: "ACTIVE",
        },
      }),
      prisma.returns_entry.count({
        where: {
          description_of_goods: sale.urn_number,
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

export default GetSaleDeleteImpact;
