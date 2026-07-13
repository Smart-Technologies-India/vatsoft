"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import {
  DailySaleSummary,
  GroupedDailySale,
} from "@/action/stock/getuserdailysale";

export type DailySaleSortField =
  | "invoice_number"
  | "invoice_date"
  | "trade_name"
  | "tin_number"
  | "invoice_value";

export type DailySaleSortOrder = "asc" | "desc";

interface GetGeneratedInvoicesPayload {
  dvatid: number;
  take: number;
  skip: number;
  searchTerm?: string;
  sortField?: DailySaleSortField;
  sortOrder?: DailySaleSortOrder;
  startDate?: string;
  endDate?: string;
}

type DailySaleFilteredSummary = {
  overallSummary: DailySaleSummary;
  filteredSummary: DailySaleSummary;
};

const ZERO_SUMMARY: DailySaleSummary = {
  totalInvoices: 0,
  totalTaxableValue: 0,
  totalVatAmount: 0,
  totalInvoiceValue: 0,
};

const summarize = (groups: GroupedDailySale[]): DailySaleSummary =>
  groups.reduce(
    (acc, group) => {
      acc.totalInvoices += 1;
      acc.totalTaxableValue += group.totalTaxableValue;
      acc.totalVatAmount += group.totalVatAmount;
      acc.totalInvoiceValue += group.totalInvoiceValue;
      return acc;
    },
    { ...ZERO_SUMMARY },
  );

const GetGeneratedInvoices = async (
  payload: GetGeneratedInvoicesPayload,
): Promise<PaginationResponse<GroupedDailySale[]>> => {
  const functionname: string = GetGeneratedInvoices.name;

  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      return createPaginationResponse({
        message: "Not authenticated. Please login.",
        functionname,
      });
    }

    const dailySaleRows = await prisma.daily_sale.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        is_dvat_31: true,
        dvat04Id: payload.dvatid,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }, { invoice_number: "desc" }],
    });

    if (!dailySaleRows) {
      return createPaginationResponse({
        message: "No generated invoices found.",
        functionname,
      });
    }

    const groupedMap = new Map<string, GroupedDailySale>();

    dailySaleRows.forEach((record) => {
      const key = `${record.invoice_number}_${record.invoice_date.toISOString()}_${record.seller_tin_numberId}`;

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.records.push(record);
        existing.count += 1;
        existing.totalTaxableValue += parseFloat(record.amount);
        existing.totalVatAmount += parseFloat(record.vatamount);
        existing.totalInvoiceValue +=
          parseFloat(record.amount) + parseFloat(record.vatamount);
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
          urn_number: record.urn_number || "",
        });
      }
    });

    let filtered = Array.from(groupedMap.values());

    // Filter by search term
    if (payload.searchTerm?.trim()) {
      const term = payload.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (group) =>
          group.invoice_number.toLowerCase().includes(term) ||
          group.seller_tin_number.name_of_dealer.toLowerCase().includes(term) ||
          group.seller_tin_number.tin_number.toLowerCase().includes(term),
      );
    }

    // Filter by date range
    if (payload.startDate && payload.endDate) {
      const start = new Date(payload.startDate);
      const end = new Date(payload.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (group) => group.invoice_date >= start && group.invoice_date <= end,
      );
    }

    // Sort
    const sortField = payload.sortField || "invoice_date";
    const sortOrder = payload.sortOrder || "desc";
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === "trade_name") {
        aVal = a.seller_tin_number.name_of_dealer;
        bVal = b.seller_tin_number.name_of_dealer;
      } else if (sortField === "tin_number") {
        aVal = a.seller_tin_number.tin_number;
        bVal = b.seller_tin_number.tin_number;
      } else if (sortField === "invoice_value") {
        aVal = a.totalInvoiceValue;
        bVal = b.totalInvoiceValue;
      } else {
        aVal = a[sortField as keyof GroupedDailySale];
        bVal = b[sortField as keyof GroupedDailySale];
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const overallSummary = summarize(filtered);

    const paginatedFiltered = filtered.slice(
      payload.skip,
      payload.skip + payload.take,
    );
    const filteredSummary = summarize(paginatedFiltered);

    return createPaginationResponse({
      message: "Generated invoices fetched successfully.",
      functionname,
      data: paginatedFiltered,
      take: payload.take,
      skip: payload.skip,
      total,
      summary: {
        overallSummary,
        filteredSummary,
      },
    });
  } catch (error) {
    return createPaginationResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetGeneratedInvoices;
