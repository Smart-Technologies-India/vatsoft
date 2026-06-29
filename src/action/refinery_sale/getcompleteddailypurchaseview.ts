"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { commodity_master, daily_purchase, tin_number_master } from "@prisma/client";
import prisma from "../../../prisma/database";

export type CompletedDailyPurchaseRow = daily_purchase & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
};

export interface CompletedDailyPurchaseView {
  invoiceNumber: string;
  invoiceDate: Date;
  rows: CompletedDailyPurchaseRow[];
}

const GetCompletedDailyPurchaseView = async (
  id: number,
): Promise<ApiResponseType<CompletedDailyPurchaseView | null>> => {
  const functionname = GetCompletedDailyPurchaseView.name;

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
      select: {
        id: true,
        tin_master_id: true,
      },
    });

    if (!refinery) {
      return createResponse({
        message: "No refinery profile found.",
        functionname,
      });
    }

    const targetSale = await prisma.refinery_sale.findFirst({
      where: {
        id,
        refineryId: refinery.id,
        refinery_status: "COMPLETED",
        deletedAt: null,
        status: "ACTIVE",
      },
      select: {
        invoice_number: true,
        invoice_date: true,
        seller_tin_numberId: true,
      },
    });

    if (!targetSale) {
      return createResponse({
        message: "Completed invoice not found.",
        functionname,
      });
    }

    const rows = await prisma.daily_purchase.findMany({
      where: {
        invoice_number: targetSale.invoice_number,
        invoice_date: targetSale.invoice_date,
        dvat04Id: targetSale.seller_tin_numberId,
        seller_tin_numberId: refinery.tin_master_id,
        deletedAt: null,
        status: "ACTIVE",
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return createResponse({
      functionname,
      message: "Completed daily purchase view loaded.",
      data: {
        invoiceNumber: targetSale.invoice_number,
        invoiceDate: targetSale.invoice_date,
        rows,
      },
    });
  } catch (error) {
    return createResponse({
      functionname,
      message: errorToString(error),
    });
  }
};

export default GetCompletedDailyPurchaseView;
