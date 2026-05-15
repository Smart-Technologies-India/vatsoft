"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

export interface DispatchPayload {
  id: number; // any row id of the invoice
  invoice_number: string;
  invoice_date: string; // ISO date string
  vehicle_number: string;
  shipment_time: string; // ISO datetime string
}

const DispatchRefinerySale = async (
  payload: DispatchPayload
): Promise<ApiResponseType<null>> => {
  const functionname = DispatchRefinerySale.name;

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
        id: payload.id,
        refineryId: refinery.id,
        refinery_status: "VATPAID",
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    if (!targetSale) {
      return createResponse({
        message: "Invoice not found or already dispatched.",
        functionname,
      });
    }

    await prisma.refinery_sale.updateMany({
      where: {
        refineryId: refinery.id,
        invoice_number: targetSale.invoice_number,
        seller_tin_numberId: targetSale.seller_tin_numberId,
        refinery_status: "VATPAID",
        deletedAt: null,
        status: "ACTIVE",
      },
      data: {
        refinery_status: "DISPATCH",
        invoice_number: payload.invoice_number,
        invoice_date: new Date(payload.invoice_date),
        vehicle_number: payload.vehicle_number,
        Shipment_time: new Date(payload.shipment_time),
        updatedById: currentUserId,
        updatedAt: new Date(),
      },
    });

    return {
      status: true,
      data: null,
      message: "Invoice dispatched successfully.",
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

export default DispatchRefinerySale;
