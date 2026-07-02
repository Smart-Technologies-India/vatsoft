"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  refinery_sale,
  commodity_master,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface CreateRefinerySalePayload {
  purchaser_refinery_id: number;
  purchaser_tin_number?: string;
  invoice_number?: string;
  invoice_date?: Date;
  commodity_master_id: number;
  price: number;
  quantity: number;
  allow_existing_invoice?: boolean;
}

const ALLOWED_COMMODITY_IDS = [1, 2, 748, 749];

type RefinerySaleWithRelations = refinery_sale & {
  commodity_master: commodity_master;
  seller_tin_number: tin_number_master;
};

const buildInvoiceNumber = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(100 + Math.random() * 900);
  return `RS-${timestamp}-${random}`;
};

const CreateRefinerySale = async (
  payload: CreateRefinerySalePayload,
): Promise<ApiResponseType<RefinerySaleWithRelations | null>> => {
  const functionname: string = CreateRefinerySale.name;

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

    if (
      !Number.isInteger(payload.purchaser_refinery_id) ||
      payload.purchaser_refinery_id <= 0
    ) {
      return createResponse({
        message: "Please select a valid purchaser refinery.",
        functionname,
      });
    }

    const mappedDealer = await prisma.refinery_dealer.findFirst({
      where: {
        dealerId: currentDvatId,
        refineryId: payload.purchaser_refinery_id,
        deletedAt: null,
        status: "ACTIVE",
        refinery: {
          deletedAt: null,
        },
        dvat: {
          deletedAt: null,
          status: "APPROVED",
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        refinery: true,
        dvat: {
          select: {
            tin_master_id: true,
            tin_master: {
              select: {
                tin_number: true,
              },
            },
          },
        },
      },
    });

    if (!mappedDealer || !mappedDealer.refinery) {
      return createResponse({
        message: "Selected refinery is not mapped in refinery dealer master.",
        functionname,
      });
    }

    const refineryResponse = mappedDealer.refinery;
    const currentDvatTin = mappedDealer.dvat?.tin_master?.tin_number || "";

    if (!mappedDealer.dvat?.tin_master_id) {
      return createResponse({
        message: "Current DVAT TIN details not found.",
        functionname,
      });
    }

    if (
      refineryResponse.tinNumber &&
      refineryResponse.tinNumber === currentDvatTin
    ) {
      return createResponse({
        message: "Refinery TIN number cannot be your own TIN.",
        functionname,
      });
    }

    const commodityResponse = await prisma.commodity_master.findFirst({
      where: {
        id: payload.commodity_master_id,
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!commodityResponse) {
      return createResponse({
        message: "Selected item not found.",
        functionname,
      });
    }

    if (!ALLOWED_COMMODITY_IDS.includes(commodityResponse.id)) {
      return createResponse({
        message: "Selected item is not allowed for refinery sale.",
        functionname,
      });
    }

    if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
      return createResponse({
        message: "Quantity must be greater than 0.",
        functionname,
      });
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      return createResponse({
        message: "Price must be 0 or greater.",
        functionname,
      });
    }

    const salePrice = Number(payload.price);
    const taxPercent = Number.parseFloat(commodityResponse.taxable_at || "0");

    if (!Number.isFinite(salePrice) || salePrice < 0) {
      return createResponse({
        message: "Item sale price is invalid.",
        functionname,
      });
    }

    if (!Number.isFinite(taxPercent) || taxPercent < 0) {
      return createResponse({
        message: "Item tax percentage is invalid.",
        functionname,
      });
    }

    const taxableAmount =
      (salePrice * payload.quantity) / (1 + taxPercent / 100);
    const vatAmount = (taxableAmount * taxPercent) / 100;

    const invoiceDate = payload.invoice_date
      ? new Date(payload.invoice_date)
      : new Date();
    const invoiceNumber =
      payload.invoice_number?.trim() || buildInvoiceNumber();

    const shouldAllowExistingInvoice = payload.allow_existing_invoice === true;
    let finalInvoiceNumber = invoiceNumber;

    if (!shouldAllowExistingInvoice) {
      const existingInvoice = await prisma.refinery_sale.findFirst({
        where: {
          refineryId: refineryResponse.id,
          invoice_number: invoiceNumber,
          deletedAt: null,
        },
      });

      finalInvoiceNumber = existingInvoice
        ? buildInvoiceNumber()
        : invoiceNumber;
    }

    const createdEntry = await prisma.refinery_sale.create({
      data: {
        refineryId: refineryResponse.id,
        invoice_number: finalInvoiceNumber,
        temp_invoice_number: finalInvoiceNumber,
        Shipment_time: invoiceDate,
        invoice_date: invoiceDate,
        commodity_masterId: commodityResponse.id,
        seller_tin_numberId: mappedDealer.dvat.tin_master_id,
        amount_unit: "UNIT",
        quantity: payload.quantity,
        tax_percent: taxPercent.toFixed(2),
        amount: taxableAmount.toFixed(2),
        vatamount: vatAmount.toFixed(2),
        is_local:
          currentDvatTin.startsWith("25") || currentDvatTin.startsWith("26"),
        createdById: currentUserId,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
    });

    return createResponse({
      message: "Refinery sale entry created successfully.",
      functionname,
      data: createdEntry,
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default CreateRefinerySale;
