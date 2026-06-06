"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { stock } from "@prisma/client";
import prisma from "../../../prisma/database";
import CreateDailyPurchase from "./createdailypuchase";

interface CreateMultiDailyPurchasePayload {
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
    is_against_fform?: boolean;
    is_against_e1form?: boolean;
    is_against_iform?: boolean;
    is_against_hform?: boolean;
    is_export?: boolean;
    batch_name: string | null;
  }>;
}

const CreateMultiDailyPurchase = async (
  payload: CreateMultiDailyPurchasePayload,
): Promise<ApiResponseType<stock[] | null>> => {
  const functionname: string = CreateMultiDailyPurchase.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "CreateMultiDailyPurchase",
      } as any;
    }

    let createdCount = 0;

    for (const entry of payload.entries) {
      const isexist = await prisma.daily_purchase.findFirst({
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

      const response = await CreateDailyPurchase(entry);

      if (!response.status || !response.data) {
        throw new Error(
          `Failed to create entry for invoice: ${entry.invoice_number}, error: ${response.message}`,
        );
      }

      createdCount += 1;
    }

    return createResponse({
      message: `${createdCount} entr${createdCount === 1 ? "y" : "ies"} created successfully.`,
      functionname,
      data: null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateMultiDailyPurchase;
