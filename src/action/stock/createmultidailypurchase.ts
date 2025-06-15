"use server";

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
  }>;
}

const CreateMultiDailyPurchase = async (
  payload: CreateMultiDailyPurchasePayload
): Promise<ApiResponseType<stock[] | null>> => {
  const functionname: string = CreateMultiDailyPurchase.name;

  try {
    const results = await prisma.$transaction(async (prisma) => {
      const createdEntries = [];

      for (const entry of payload.entries) {
        const isexist = await prisma.daily_purchase.findFirst({
          where: {
            deletedAt: null,
            deletedBy: null,
            status: "ACTIVE",
            invoice_number: entry.invoice_number,
            quantity: entry.quantity,
            invoice_date: entry.invoice_date,
            commodity_masterId: entry.commodityid,
          },
        });

        if (isexist) {
          throw new Error(
            `Entry with invoice number ${entry.invoice_number} already exists.`
          );
        }
        const response = await CreateDailyPurchase(entry);

        if (!response.status || !response.data) {
          throw new Error(
            `Failed to create entry for invoice: ${entry.invoice_number}, error: ${response.message}`
          );
        }
        createdEntries.push(response.data);
      }

      return createdEntries;
    });

    return createResponse({
      message: "All entries created successfully.",
      functionname,
      data: results,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateMultiDailyPurchase;
