"use server";

import { getCurrentRefineryId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { refinery_sale } from "@prisma/client";

export type InvoiceDetail = refinery_sale & {
  sellerName?: string;
};

const GetDealerInvoiceDetails = async (
  sellerTinNumberId: number,
  refineryStatus?: "COMPLETED" | "VATPAID" | null
): Promise<ApiResponseType<InvoiceDetail[] | null>> => {
  const functionname = GetDealerInvoiceDetails.name;

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

    // Build where clause
    const whereClause: any = {
      refineryId: refinery.id,
      seller_tin_numberId: sellerTinNumberId,
      status: "ACTIVE",
      deletedAt: null,
      deletedById: null,
    };

    if (refineryStatus) {
      whereClause.refinery_status = refineryStatus;
    }

    const invoices = await prisma.refinery_sale.findMany({
      where: whereClause,
      include: {
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }],
    });

    const detailedInvoices: InvoiceDetail[] = invoices.map((inv) => ({
      ...inv,
      sellerName: inv.seller_tin_number.name_of_dealer,
    }));

    return createResponse({
      message: `Found ${detailedInvoices.length} invoices.`,
      functionname,
      data: detailedInvoices,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetDealerInvoiceDetails;
