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

interface GetUserDailySaleFilteredPayload {
  dvatid: number;
  take: number;
  skip: number;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  acceptStatusFilter?: "all" | "pending" | "accepted";
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
      acc.totalTaxableValue += Number(group.totalTaxableValue) || 0;
      acc.totalVatAmount += Number(group.totalVatAmount) || 0;
      acc.totalInvoiceValue += Number(group.totalInvoiceValue) || 0;
      return acc;
    },
    { ...ZERO_SUMMARY },
  );

const GetUserDailySaleFiltered = async (
  payload: GetUserDailySaleFilteredPayload,
): Promise<PaginationResponse<Array<GroupedDailySale> | null>> => {
  const functionname: string = GetUserDailySaleFiltered.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetUserDailySaleFiltered",
      } as any;
    }

    // Build where condition for database query
    const whereCondition: any = {
      deletedAt: null,
      deletedById: null,
      status: "ACTIVE",
      is_dvat_31: false,
      dvat04Id: payload.dvatid,
    };

    // Apply date filter at database level
    if (payload.startDate || payload.endDate) {
      const dateFilter: any = {};
      if (payload.startDate) {
        dateFilter.gte = new Date(payload.startDate);
      }
      if (payload.endDate) {
        dateFilter.lt = new Date(payload.endDate);
      }
      whereCondition.invoice_date = dateFilter;
    }

    const searchTerm = (payload.searchTerm ?? "").trim().toLowerCase();
    const acceptStatusFilter = payload.acceptStatusFilter ?? "all";

    // Fetch ALL data for grouping (since we need to group by invoice_number + date + seller)
    // But apply all filters at database level first
    const dailySaleRows = await prisma.daily_sale.findMany({
      where: whereCondition,
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }, { invoice_number: "desc" }],
    });

    if (!dailySaleRows || dailySaleRows.length === 0) {
      return createPaginationResponse({
        message: "No Daily sale found. Please try again.",
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

    let groupedArray = Array.from(groupedMap.values());

    // Apply search filter in memory (can't be done at DB level due to grouping)
    if (searchTerm !== "") {
      groupedArray = groupedArray.filter(
        (group) =>
          group.invoice_number.toLowerCase().includes(searchTerm) ||
          group.seller_tin_number.name_of_dealer
            .toLowerCase()
            .includes(searchTerm) ||
          group.seller_tin_number.tin_number.includes(searchTerm),
      );
    }

    // Apply accept status filter in memory (can't be done at DB level due to grouping logic)
    if (acceptStatusFilter !== "all") {
      groupedArray = groupedArray.filter((group) => {
        const hasPending = group.records.some((record) => !record.is_accept);

        if (acceptStatusFilter === "pending") return hasPending;
        if (acceptStatusFilter === "accepted") return !hasPending;
        return true;
      });
    }

    // Sort in memory: by is_paid status (red -> green)
    // Red (is_paid === false) = 0 (first)
    // Green (is_paid === true) = 1 (last)
    groupedArray.sort((a, b) => {
      // Check if ANY record in this group has is_paid === false
      const aHasNotPaid = a.records.some((record) => !record.is_paid);
      const bHasNotPaid = b.records.some((record) => !record.is_paid);

      // Red rows (not paid) come first
      if (aHasNotPaid && !bHasNotPaid) return -1;
      if (!aHasNotPaid && bHasNotPaid) return 1;
      return 0;
    });

    const filteredSummary = summarize(groupedArray);
    const totalCount = groupedArray.length;

    // Paginate after grouping, filtering, and sorting
    const paginatedGroups = groupedArray.slice(
      payload.skip,
      payload.skip + payload.take,
    );

    const summary: DailySaleFilteredSummary = {
      overallSummary: filteredSummary,
      filteredSummary,
    };

    return createPaginationResponse({
      message: "Daily sale data fetched successfully.",
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

export default GetUserDailySaleFiltered;
