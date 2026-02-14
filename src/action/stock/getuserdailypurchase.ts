"use server";

import { errorToString } from "@/utils/methods";
import {
  commodity_master,
  daily_purchase,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface GetUserDailyPurchasePayload {
  dvatid: number;
  take: number;
  skip: number;
}

export type GroupedDailyPurchase = {
  invoice_number: string;
  invoice_date: Date;
  seller_tin_id: number;
  seller_tin_number: tin_number_master;
  records: Array<
    daily_purchase & {
      commodity_master: commodity_master;
      seller_tin_number: tin_number_master;
    }
  >;
  count: number;
  totalTaxableValue: number;
  totalVatAmount: number;
  totalInvoiceValue: number;
  hasPendingAcceptable: boolean;
};

const GetUserDailyPurchase = async (
  payload: GetUserDailyPurchasePayload,
): Promise<PaginationResponse<Array<GroupedDailyPurchase> | null>> => {
  const functionname: string = GetUserDailyPurchase.name;

  try {
    const daily_purchase_response = await prisma.daily_purchase.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        is_dvat_30a: false,
        dvat04Id: payload.dvatid,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }, { invoice_number: "desc" }],
    });

    if (!daily_purchase_response) {
      return createPaginationResponse({
        message: "No Daily Purchase found. Please try again.",
        functionname,
      });
    }

    // Group records by invoice_number, invoice_date, and seller_tin_id
    const groupedMap = new Map<string, GroupedDailyPurchase>();

    daily_purchase_response.forEach((record) => {
      const key = `${record.invoice_number}_${record.invoice_date.toISOString()}_${record.seller_tin_numberId}`;

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.records.push(record);
        existing.count++;
        existing.totalTaxableValue += parseFloat(record.amount);
        existing.totalVatAmount += parseFloat(record.vatamount);
        existing.totalInvoiceValue +=
          parseFloat(record.amount_unit) * record.quantity +
          parseFloat(record.vatamount);
        // Check if any record in the group has pending acceptable
        if (
          (record.seller_tin_number.tin_number.startsWith("25") ||
            record.seller_tin_number.tin_number.startsWith("26")) &&
          !record.is_accept
        ) {
          existing.hasPendingAcceptable = true;
        }
      } else {
        groupedMap.set(key, {
          invoice_number: record.invoice_number,
          invoice_date: record.invoice_date,
          seller_tin_id: record.seller_tin_numberId,
          seller_tin_number: record.seller_tin_number,
          records: [record],
          count: 1,
          totalTaxableValue: parseFloat(record.amount),
          totalVatAmount: parseFloat(record.vatamount),
          totalInvoiceValue:
            parseFloat(record.amount_unit) * record.quantity +
            parseFloat(record.vatamount),
          hasPendingAcceptable:
            (record.seller_tin_number.tin_number.startsWith("25") ||
              record.seller_tin_number.tin_number.startsWith("26")) &&
            !record.is_accept,
        });
      }
    });

    const groupedArray = Array.from(groupedMap.values());

    // Sort: pending acceptable first, then by date
    groupedArray.sort((a, b) => {
      if (a.hasPendingAcceptable === b.hasPendingAcceptable) return 0;
      return a.hasPendingAcceptable ? -1 : 1;
    });

    const totalCount = groupedArray.length;

    // Apply pagination to grouped results
    const paginatedGroups = groupedArray.slice(
      payload.skip,
      payload.skip + payload.take,
    );

    return createPaginationResponse({
      message: "All Daily Purchase Data get successfully",
      functionname,
      data: paginatedGroups,
      take: payload.take,
      skip: payload.skip,
      total: totalCount,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetUserDailyPurchase;
