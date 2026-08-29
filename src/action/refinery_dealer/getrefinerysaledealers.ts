"use server";

import { getCurrentRefineryId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { tin_number_master } from "@prisma/client";

export type RefinerySaleDealer = tin_number_master & {
  invoiceCount: number;
  totalQuantity: number;
  completedCount: number;
  vatpaidCount: number;
  lastInvoiceDate: Date | null;
};

const GetRefinerySaleDealers = async (): Promise<
  ApiResponseType<RefinerySaleDealer[] | null>
> => {
  const functionname = GetRefinerySaleDealers.name;

  try {
    const currentRefineryId = await getCurrentRefineryId();
    if (!currentRefineryId) {
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
        deletedById: null,
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

    // Get all unique dealers from refinery_sale for this refinery
    const dealerSales = await prisma.refinery_sale.findMany({
      where: {
        refineryId: refinery.id,
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
      },
      include: {
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }],
    });

    // Group by seller_tin_number and aggregate data
    const dealerMap = new Map<number, RefinerySaleDealer>();

    for (const sale of dealerSales) {
      const dealerId = sale.seller_tin_numberId;

      if (!dealerMap.has(dealerId)) {
        dealerMap.set(dealerId, {
          ...sale.seller_tin_number,
          invoiceCount: 0,
          totalQuantity: 0,
          completedCount: 0,
          vatpaidCount: 0,
          lastInvoiceDate: sale.invoice_date,
        });
      }

      const dealer = dealerMap.get(dealerId)!;
      dealer.invoiceCount += 1;
      dealer.totalQuantity += sale.quantity;
      if (sale.refinery_status === "COMPLETED") {
        dealer.completedCount += 1;
      } else if (sale.refinery_status === "VATPAID") {
        dealer.vatpaidCount += 1;
      }
      if (!dealer.lastInvoiceDate || sale.invoice_date > dealer.lastInvoiceDate) {
        dealer.lastInvoiceDate = sale.invoice_date;
      }
    }

    const dealers = Array.from(dealerMap.values()).sort(
      (a, b) =>
        (b.lastInvoiceDate?.getTime() || 0) -
        (a.lastInvoiceDate?.getTime() || 0),
    );

    return createResponse({
      message: `Found ${dealers.length} dealers in refinery sales.`,
      functionname,
      data: dealers,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetRefinerySaleDealers;
