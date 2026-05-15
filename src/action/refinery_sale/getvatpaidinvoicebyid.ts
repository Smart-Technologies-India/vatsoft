"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  commodity_master,
  refinery_sale,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

export type VatpaidInvoiceRow = refinery_sale & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
};

export interface VatpaidInvoiceDetail {
  invoiceNumber: string;
  invoiceDate: Date;
  buyer: tin_number_master;
  rows: VatpaidInvoiceRow[];
}

const GetVatpaidInvoiceById = async (
  id: number
): Promise<ApiResponseType<VatpaidInvoiceDetail | null>> => {
  const functionname = GetVatpaidInvoiceById.name;

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
      where: { deletedAt: null, createdById: currentUserId },
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
        refinery_status: "VATPAID",
        deletedAt: null,
        status: "ACTIVE",
      },
      include: {
        seller_tin_number: true,
        commodity_master: true,
      },
    });

    if (!targetSale) {
      return createResponse({
        message: "Invoice not found or not in VATPAID status.",
        functionname,
      });
    }

    const allRows = await prisma.refinery_sale.findMany({
      where: {
        refineryId: refinery.id,
        invoice_number: targetSale.invoice_number,
        seller_tin_numberId: targetSale.seller_tin_numberId,
        refinery_status: "VATPAID",
        deletedAt: null,
        status: "ACTIVE",
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: { id: "asc" },
    });

    return {
      status: true,
      data: {
        invoiceNumber: targetSale.invoice_number,
        invoiceDate: targetSale.invoice_date,
        buyer: targetSale.seller_tin_number,
        rows: allRows,
      },
      message: "Invoice loaded.",
      functionname,
    };
  } catch (error) {
    return {
      status: false,
      data: null,
      message: errorToString(error),
      functionname,
    };
  }
};

export default GetVatpaidInvoiceById;
