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

    // Step 1: Get distinct invoice groups
    const allDistinctInvoices = await prisma.daily_purchase.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        is_dvat_30a: false,
        dvat04Id: payload.dvatid,
      },
      select: {
        invoice_number: true,
        invoice_date: true,
        seller_tin_numberId: true,
      },
      distinct: ["invoice_number", "invoice_date", "seller_tin_numberId"],
    });

    if (!allDistinctInvoices || allDistinctInvoices.length === 0) {
      return createPaginationResponse({
        message: "No Daily Purchase found. Please try again.",
        functionname,
      });
    }

    // Step 2: Get payment status for each invoice group
    const invoiceGroupsWithStatus = await Promise.all(
      allDistinctInvoices.map(async (inv) => {
        // Check if ANY record in this group has PAID status
        const paidRecord = await prisma.daily_purchase.findFirst({
          where: {
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date,
            seller_tin_numberId: inv.seller_tin_numberId,
            deletedAt: null,
            status: "ACTIVE",
            dvat04Id: payload.dvatid,
            payment_status: "PAID",
          },
        });

        if (paidRecord) {
          return { ...inv, paymentStatus: "PAID", sortKey: 0 };
        }

        // Check if ANY record in this group has DEALER_PAID status
        const dealerPaidRecord = await prisma.daily_purchase.findFirst({
          where: {
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date,
            seller_tin_numberId: inv.seller_tin_numberId,
            deletedAt: null,
            status: "ACTIVE",
            dvat04Id: payload.dvatid,
            payment_status: "DEALER_PAID",
          },
        });

        if (dealerPaidRecord) {
          return { ...inv, paymentStatus: "DEALER_PAID", sortKey: 2 };
        }

        // Default: red (middle)
        return { ...inv, paymentStatus: "OTHER", sortKey: 1 };
      }),
    );

    // Step 3: Sort by payment status
    invoiceGroupsWithStatus.sort((a, b) => {
      if (a.sortKey !== b.sortKey) {
        return a.sortKey - b.sortKey;
      }
      return new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime();
    });

    const totalCount = invoiceGroupsWithStatus.length;

    // Step 4: Get paginated invoice groups
    const paginatedInvoices = invoiceGroupsWithStatus.slice(
      payload.skip,
      payload.skip + payload.take,
    );
    const daily_purchase_response = await prisma.daily_purchase.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        is_dvat_30a: false,
        dvat04Id: payload.dvatid,
        OR: paginatedInvoices.map((inv) => ({
          invoice_number: inv.invoice_number,
          invoice_date: inv.invoice_date,
          seller_tin_numberId: inv.seller_tin_numberId,
        })),
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }],
    });

    if (!daily_purchase_response || daily_purchase_response.length === 0) {
      return createPaginationResponse({
        message: "No Daily Purchase found. Please try again.",
        functionname,
      });
    }

    // Step 4: Group the fetched records
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

    // Return groups in sorted order (from paginatedInvoices)
    const paginatedGroups = paginatedInvoices.map((inv) => {
      const key = `${inv.invoice_number}_${inv.invoice_date.toISOString()}_${inv.seller_tin_numberId}`;
      return groupedMap.get(key)!;
    });

    const summary: DailyPurchaseSummary = paginatedGroups.reduce(
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
