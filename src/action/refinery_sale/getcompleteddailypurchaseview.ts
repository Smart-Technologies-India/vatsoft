"use server";

import { getCurrentRefineryId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import {
  commodity_master,
  refinery_sale,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";

export type CompletedDailyPurchaseRow = refinery_sale & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
};

export interface CompletedDailyPurchaseView {
  invoiceNumber: string;
  invoiceDate: Date;
  cstPurchase: string;
  rows: CompletedDailyPurchaseRow[];
}

const GetCompletedDailyPurchaseView = async (
  id: number,
): Promise<ApiResponseType<CompletedDailyPurchaseView | null>> => {
  const functionname = GetCompletedDailyPurchaseView.name;

  try {
    const currentUserId = await getCurrentRefineryId();
    const currentRefineryId = await getCurrentRefineryId();
    if (!currentRefineryId || !currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const refinery = await prisma.refinery.findFirst({
      where: {
        id: currentRefineryId,
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
        cst_purchase: true,
        invoice_number: true,
        invoice_date: true,
        seller_tin_numberId: true,
        seller_tin_number: {
          select: {
            tin_number: true,
          },
        },
      },
    });

    if (!targetSale) {
      return createResponse({
        message: "Completed invoice not found.",
        functionname,
      });
    }

    // Retrieve all completed refinery_sale records for this invoice
    const rows = await prisma.refinery_sale.findMany({
      where: {
        refineryId: refinery.id,
        invoice_number: targetSale.invoice_number,
        invoice_date: targetSale.invoice_date,
        seller_tin_numberId: targetSale.seller_tin_numberId,
        refinery_status: "COMPLETED",
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

    if (!rows || rows.length === 0) {
      return createResponse({
        message: "No completed sale records found for this invoice.",
        functionname,
      });
    }

    return createResponse({
      functionname,
      message: "Completed sale records loaded.",
      data: {
        invoiceNumber: targetSale.invoice_number,
        invoiceDate: targetSale.invoice_date,
        cstPurchase: targetSale.cst_purchase ?? "0",
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
