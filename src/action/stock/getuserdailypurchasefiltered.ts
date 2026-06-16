"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import {
  DailyPurchaseSummary,
  GroupedDailyPurchase,
} from "@/action/stock/getuserdailypurchase";

export type DailyPurchaseSortField =
  | "invoice_number"
  | "invoice_date"
  | "trade_name"
  | "tin_number"
  | "invoice_value";

export type DailyPurchaseSortOrder = "asc" | "desc";

interface GetUserDailyPurchaseFilteredPayload {
  dvatid: number;
  take: number;
  skip: number;
  searchTerm?: string;
  sortField?: DailyPurchaseSortField;
  sortOrder?: DailyPurchaseSortOrder;
  startDate?: string;
  endDate?: string;
  acceptStatusFilter?: "all" | "pending" | "accepted";
}

type DailyPurchaseFilteredSummary = {
  overallSummary: DailyPurchaseSummary;
  filteredSummary: DailyPurchaseSummary;
};

const ZERO_SUMMARY: DailyPurchaseSummary = {
  totalInvoices: 0,
  totalTaxableValue: 0,
  totalVatAmount: 0,
  totalInvoiceValue: 0,
};

const summarize = (groups: GroupedDailyPurchase[]): DailyPurchaseSummary =>
  groups.reduce(
    (acc, group) => {
      acc.totalInvoices += 1;
      acc.totalTaxableValue += Number(group.totalTaxableValue) || 0;
      acc.totalVatAmount += Number(group.totalVatAmount) || 0;
      acc.totalInvoiceValue += Number(group.totalInvoiceValue) || 0;
      return acc;
    },
    { ...ZERO_SUMMARY },
  );

const GetUserDailyPurchaseFiltered = async (
  payload: GetUserDailyPurchaseFilteredPayload,
): Promise<PaginationResponse<Array<GroupedDailyPurchase> | null>> => {
  const functionname: string = GetUserDailyPurchaseFiltered.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetUserDailyPurchaseFiltered",
      } as any;
    }

    const rows = await prisma.daily_purchase.findMany({
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

    if (!rows) {
      return createPaginationResponse({
        message: "No Daily Purchase found. Please try again.",
        functionname,
      });
    }

    const groupedMap = new Map<string, GroupedDailyPurchase>();

    rows.forEach((record) => {
      const key = `${record.invoice_number}_${record.invoice_date.toISOString()}_${record.seller_tin_numberId}`;

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.records.push(record);
        existing.count += 1;
        existing.totalTaxableValue += parseFloat(record.amount);
        existing.totalVatAmount += parseFloat(record.vatamount);
        existing.totalInvoiceValue +=
          parseFloat(record.amount) + parseFloat(record.vatamount);

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
    const overallSummary = summarize(groupedArray);

    const searchTerm = (payload.searchTerm ?? "").trim().toLowerCase();
    const sortField: DailyPurchaseSortField = payload.sortField ?? "invoice_date";
    const sortOrder: DailyPurchaseSortOrder = payload.sortOrder ?? "desc";
    const acceptStatusFilter = payload.acceptStatusFilter ?? "all";

    let filtered = [...groupedArray];

    if (searchTerm !== "") {
      filtered = filtered.filter(
        (group) =>
          group.invoice_number.toLowerCase().includes(searchTerm) ||
          group.seller_tin_number.name_of_dealer
            .toLowerCase()
            .includes(searchTerm) ||
          group.seller_tin_number.tin_number.includes(searchTerm),
      );
    }

    if (payload.startDate || payload.endDate) {
      const startDate = payload.startDate ? new Date(payload.startDate) : null;
      const endDate = payload.endDate ? new Date(payload.endDate) : null;

      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }

      filtered = filtered.filter((group) => {
        const invoiceDate = new Date(group.invoice_date);

        if (startDate && invoiceDate < startDate) return false;
        if (endDate && invoiceDate > endDate) return false;
        return true;
      });
    }

    if (acceptStatusFilter !== "all") {
      filtered = filtered.filter((group) => {
        const hasPending = group.records.some(
          (record) =>
            (record.seller_tin_number.tin_number.startsWith("25") ||
              record.seller_tin_number.tin_number.startsWith("26")) &&
            !record.is_accept,
        );

        if (acceptStatusFilter === "pending") return hasPending;
        if (acceptStatusFilter === "accepted") return !hasPending;
        return true;
      });
    }

    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case "invoice_number":
          compareValue = a.invoice_number.localeCompare(b.invoice_number);
          break;
        case "invoice_date":
          compareValue =
            new Date(a.invoice_date).getTime() -
            new Date(b.invoice_date).getTime();
          break;
        case "trade_name":
          compareValue = a.seller_tin_number.name_of_dealer.localeCompare(
            b.seller_tin_number.name_of_dealer,
          );
          break;
        case "tin_number":
          compareValue = a.seller_tin_number.tin_number.localeCompare(
            b.seller_tin_number.tin_number,
          );
          break;
        case "invoice_value":
          compareValue = a.totalInvoiceValue - b.totalInvoiceValue;
          break;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    const filteredSummary = summarize(filtered);
    const totalCount = filtered.length;

    const paginatedGroups = filtered.slice(
      payload.skip,
      payload.skip + payload.take,
    );

    const summary: DailyPurchaseFilteredSummary = {
      overallSummary,
      filteredSummary,
    };

    return createPaginationResponse({
      message: "Daily purchase data fetched successfully.",
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

export default GetUserDailyPurchaseFiltered;
