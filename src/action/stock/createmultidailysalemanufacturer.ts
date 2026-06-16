"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import CreateDailySaleManufacturer from "./createdailysalemanufacturer";

interface CreateMultiDailySaleManufacturerPayload {
  entries: Array<{
    dvatid: number;
    commodityid: number;
    quantity: number;
    seller_tin_id: number;
    invoice_number: string;
    invoice_date: Date;
    tax_percent: string;
    amount: string;
    vatamount: string;
    amount_unit: string;
    createdById: number;
    against_cfrom: boolean;
    is_against_fform: boolean;
    is_exempt?: boolean;
    is_against_iform?: boolean;
    is_h_export?: boolean;
    is_against_e1?: boolean;
    is_export: boolean;
    batch_name: string | null;
  }>;
}

const CreateMultiDailySaleManufacturer = async (
  payload: CreateMultiDailySaleManufacturerPayload,
): Promise<ApiResponseType<{ createdCount: number } | null>> => {
  const functionname: string = CreateMultiDailySaleManufacturer.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "CreateMultiDailySaleManufacturer",
      } as any;
    }

    let createdCount = 0;

    for (const entry of payload.entries) {
      const isexist = await prisma.daily_sale.findFirst({
        where: {
          dvat04Id: currentDvatId,
          deletedAt: null,
          deletedBy: null,
          status: "ACTIVE",
          invoice_number: entry.invoice_number,
          quantity: entry.quantity,
          invoice_date: entry.invoice_date,
          commodity_masterId: entry.commodityid,
          ...(entry.batch_name !== null && { batch_name: entry.batch_name }),
        },
      });

      if (isexist) {
        throw new Error(
          `Entry with invoice number ${entry.invoice_number} already exists.`,
        );
      }

      const response = await CreateDailySaleManufacturer({
        ...entry,
        dvatid: currentDvatId,
      });

      if (!response.status) {
        throw new Error(
          `Failed to create entry for invoice: ${entry.invoice_number}, error: ${response.message}`,
        );
      }

      createdCount += 1;
    }

    return createResponse({
      message: `${createdCount} entr${createdCount === 1 ? "y" : "ies"} created successfully.`,
      functionname,
      data: {
        createdCount,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateMultiDailySaleManufacturer;
