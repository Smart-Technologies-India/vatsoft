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

export type VatpaidRefineryInvoice = {
  invoice_number: string;
  invoice_date: Date;
  buyer: tin_number_master;
  items: Array<{
    id: number;
    commodity_master: commodity_master;
    quantity: number;
    amount_unit: string;
  }>;
};

const GetVatpaidRefinerySales = async (): Promise<
  ApiResponseType<Array<VatpaidRefineryInvoice> | null>
> => {
  const functionname = GetVatpaidRefinerySales.name;

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

    const refineryResponse = await prisma.refinery.findFirst({
      where: {
        deletedAt: null,
        createdById: currentUserId,
      },
    });

    if (!refineryResponse) {
      return createResponse({
        message: "No refinery profile found for this account.",
        functionname,
      });
    }

    const sales = await prisma.refinery_sale.findMany({
      where: {
        refineryId: refineryResponse.id,
        refinery_status: "VATPAID",
        deletedAt: null,
        status: "ACTIVE",
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }, { id: "desc" }],
    });

    // Group by invoice_number + seller_tin_numberId
    const invoiceMap = new Map<string, VatpaidRefineryInvoice>();
    for (const sale of sales) {
      const key = `${sale.invoice_number}_${sale.seller_tin_numberId}`;
      if (!invoiceMap.has(key)) {
        invoiceMap.set(key, {
          invoice_number: sale.invoice_number,
          invoice_date: sale.invoice_date,
          buyer: sale.seller_tin_number,
          items: [],
        });
      }
      invoiceMap.get(key)!.items.push({
        id: sale.id,
        commodity_master: sale.commodity_master,
        quantity: sale.quantity,
        amount_unit: sale.amount_unit,
      });
    }

    return {
      status: true,
      data: Array.from(invoiceMap.values()),
      message: "VATPAID refinery sales fetched successfully.",
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

export default GetVatpaidRefinerySales;
