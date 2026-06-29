"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master, refinery, refinery_sale } from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface GetCurrentDvatRefinerySaleByIdPayload {
  id: number;
}

type InvoiceRow = refinery_sale & {
  commodity_master: commodity_master;
};

export interface CurrentDvatRefineryInvoiceView {
  invoiceNumber: string;
  invoiceDate: Date;
  refinery: refinery;
  rows: InvoiceRow[];
}

const GetCurrentDvatRefinerySaleById = async (
  payload: GetCurrentDvatRefinerySaleByIdPayload,
): Promise<ApiResponseType<CurrentDvatRefineryInvoiceView | null>> => {
  const functionname = GetCurrentDvatRefinerySaleById.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const currentDvat = await prisma.dvat04.findFirst({
      where: {
        id: currentDvatId,
        deletedAt: null,
      },
      select: {
        tin_master_id: true,
      },
    });

    if (!currentDvat) {
      return createResponse({
        message: "Current DVAT profile not found.",
        functionname,
      });
    }

    const targetSale = await prisma.refinery_sale.findFirst({
      where: {
        id: payload.id,
        seller_tin_numberId: currentDvat.tin_master_id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      include: {
        refinery: true,
      },
    });

    if (!targetSale) {
      return createResponse({
        message: "Invoice not found for current DVAT.",
        functionname,
      });
    }

    const invoiceRows = await prisma.refinery_sale.findMany({
      where: {
        invoice_number: targetSale.invoice_number,
        invoice_date: targetSale.invoice_date,
        refineryId: targetSale.refineryId,
        seller_tin_numberId: targetSale.seller_tin_numberId,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      include: {
        commodity_master: true,
      },
      orderBy: [{ id: "asc" }],
    });

    return createResponse({
      message: "Invoice details fetched successfully.",
      functionname,
      data: {
        invoiceNumber: targetSale.invoice_number,
        invoiceDate: targetSale.invoice_date,
        refinery: targetSale.refinery,
        rows: invoiceRows,
      },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetCurrentDvatRefinerySaleById;
