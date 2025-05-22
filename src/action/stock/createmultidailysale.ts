"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { stock } from "@prisma/client";
import prisma from "../../../prisma/database";
import CreateDailySale from "./createdailysale";

interface CreateMultiDailySalePayload {
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

const CreateMultiDailySale = async (
  payload: CreateMultiDailySalePayload
): Promise<ApiResponseType<stock[] | null>> => {
  const functionname: string = CreateMultiDailySale.name;

  try {
    const results = await prisma.$transaction(async (prisma) => {
      const createdEntries = [];

      for (const entry of payload.entries) {
        const response = await CreateDailySale(entry);

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

export default CreateMultiDailySale;
