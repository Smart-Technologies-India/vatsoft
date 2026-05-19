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

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
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
  urn_number: string;
};

export type DailyPurchaseSummary = {
  totalInvoices: number;
  totalTaxableValue: number;
  totalVatAmount: number;
  totalInvoiceValue: number;
};

const GetUserDailyPurchase = async (
  payload: GetUserDailyPurchasePayload,
): Promise<PaginationResponse<Array<GroupedDailyPurchase> | null>> => {
  const functionname: string = GetUserDailyPurchase.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetUserDailyPurchase",
      } as any;
    }

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
      orderBy: [{ invoice_date: "desc" }],
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
          parseFloat(record.amount) + parseFloat(record.vatamount);
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
            parseFloat(record.amount) + parseFloat(record.vatamount),
          hasPendingAcceptable:
            (record.seller_tin_number.tin_number.startsWith("25") ||
              record.seller_tin_number.tin_number.startsWith("26")) &&
            !record.is_accept,
          urn_number: record.urn_number || "",
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
    const summary: DailyPurchaseSummary = groupedArray.reduce(
      (acc, group) => {
        acc.totalInvoices += 1;
        acc.totalTaxableValue += Number(group.totalTaxableValue) || 0;
        acc.totalVatAmount += Number(group.totalVatAmount) || 0;
        acc.totalInvoiceValue += Number(group.totalInvoiceValue) || 0;
        return acc;
      },
      {
        totalInvoices: 0,
        totalTaxableValue: 0,
        totalVatAmount: 0,
        totalInvoiceValue: 0,
      },
    );

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
      summary,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetUserDailyPurchase;
