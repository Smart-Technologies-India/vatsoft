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
  tankerOptions: string[];
  refineryStatus: refinery_sale["refinery_status"];
  rows: VatpaidInvoiceRow[];
}

const deriveWorkflowStatus = (
  rows: VatpaidInvoiceRow[],
): refinery_sale["refinery_status"] => {
  const statuses = rows.map((row) => row.refinery_status || "SALE");

  if (statuses.includes("COMPLETED")) {
    return "COMPLETED";
  }
  if (statuses.includes("DISPATCH")) {
    return "DISPATCH";
  }
  if (statuses.every((status) => status === "VATPAID")) {
    return "VATPAID";
  }
  if (statuses.includes("PAID")) {
    return "PAID";
  }

  return "SALE";
};

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
        message: "Invoice not found.",
        functionname,
      });
    }

    const allRows = await prisma.refinery_sale.findMany({
      where: {
        refineryId: refinery.id,
        invoice_number: targetSale.invoice_number,
        invoice_date: targetSale.invoice_date,
        seller_tin_numberId: targetSale.seller_tin_numberId,
        deletedAt: null,
        status: "ACTIVE",
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: { id: "asc" },
    });

    const buyerDvat = await prisma.dvat04.findFirst({
      where: {
        tin_master_id: targetSale.seller_tin_numberId,
        deletedAt: null,
        status: "APPROVED",
      },
      select: {
        id: true,
      },
    });

    let tankerOptions: string[] = [];
    if (buyerDvat) {
      const mappedDealer = await prisma.refinery_dealer.findFirst({
        where: {
          refineryId: refinery.id,
          dealerId: buyerDvat.id,
          deletedAt: null,
          status: "ACTIVE",
        },
        select: {
          tanker_1: true,
          tanker_2: true,
          tanker_3: true,
          tanker_4: true,
          tanker_5: true,
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      });

      if (mappedDealer) {
        tankerOptions = [
          mappedDealer.tanker_1,
          mappedDealer.tanker_2,
          mappedDealer.tanker_3,
          mappedDealer.tanker_4,
          mappedDealer.tanker_5,
        ]
          .map((item) => item?.trim())
          .filter((item): item is string => Boolean(item));
      }
    }

    return {
      status: true,
      data: {
        invoiceNumber: targetSale.invoice_number,
        invoiceDate: targetSale.invoice_date,
        buyer: targetSale.seller_tin_number,
        tankerOptions,
        refineryStatus: deriveWorkflowStatus(allRows),
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
