"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import { refinery_sale, commodity_master, tin_number_master } from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface CreateRefinerySalePayload {
  purchaser_tin_number: string;
  invoice_number?: string;
  invoice_date?: Date;
  commodity_master_id: number;
  price: number;
  quantity: number;
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
      orderBy: {
        id: "desc",
      },
    });

    if (!refineryResponse) {
      return createResponse({
        message: "No refinery profile found for this account.",
        functionname,
      });
    }

    const purchaserTin = payload.purchaser_tin_number.trim();
    if (!/^\d{11}$/.test(purchaserTin)) {
      return createResponse({
        message: "Purchaser TIN number must be 11 digits.",
        functionname,
      });
    }

    if (refineryResponse.tinNumber && refineryResponse.tinNumber === purchaserTin) {
      return createResponse({
        message: "Purchaser TIN number cannot be your own TIN.",
        functionname,
      });
    }

    const purchaserTinMaster = await prisma.tin_number_master.findFirst({
      where: {
        tin_number: purchaserTin,
        status: "ACTIVE",
        deletedAt: null,
      },
    });

    if (!purchaserTinMaster) {
      return createResponse({
        message: "Purchaser TIN number not found.",
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

    if (!Number.isFinite(payload.price) || payload.price <= 0) {
      return createResponse({
        message: "Price must be greater than 0.",
        functionname,
      });
    }

    const salePrice = Number(payload.price);
    const taxPercent = Number.parseFloat(commodityResponse.taxable_at || "0");

    if (!Number.isFinite(salePrice) || salePrice <= 0) {
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

    const taxableAmount = salePrice * payload.quantity;
    const vatAmount = (taxableAmount * taxPercent) / 100;

    const invoiceDate = payload.invoice_date
      ? new Date(payload.invoice_date)
      : new Date();
    const invoiceNumber = payload.invoice_number?.trim() || buildInvoiceNumber();

    const existingInvoice = await prisma.refinery_sale.findFirst({
      where: {
        refineryId: refineryResponse.id,
        invoice_number: invoiceNumber,
        deletedAt: null,
      },
    });

    const finalInvoiceNumber = existingInvoice ? buildInvoiceNumber() : invoiceNumber;

    const createdEntry = await prisma.refinery_sale.create({
      data: {
        refineryId: refineryResponse.id,
        invoice_number: finalInvoiceNumber,
        temp_invoice_number: finalInvoiceNumber,
        invoice_date: invoiceDate,
        commodity_masterId: commodityResponse.id,
        seller_tin_numberId: purchaserTinMaster.id,
        amount_unit: "UNIT",
        quantity: payload.quantity,
        tax_percent: taxPercent.toFixed(2),
        amount: taxableAmount.toFixed(2),
        vatamount: vatAmount.toFixed(2),
        is_local:
          purchaserTinMaster.tin_number.startsWith("25") ||
          purchaserTinMaster.tin_number.startsWith("26"),
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
