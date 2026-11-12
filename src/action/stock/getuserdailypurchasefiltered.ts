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

interface GetUserDailyPurchaseFilteredPayload {
  dvatid: number;
  take: number;
  skip: number;
  searchTerm?: string;
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

    // Get DVAT commodity type
    const dvat = await prisma.dvat04.findUnique({
      where: { id: payload.dvatid },
      select: { commodity: true },
    });

    const dvatCommodity = dvat?.commodity || "";

    // Build where condition for database query
    const whereCondition: any = {
      deletedAt: null,
      deletedById: null,
      status: "ACTIVE",
      is_dvat_30a: false,
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

    // Fetch ALL data for grouping (since we need to group by invoice + date + seller)
    // But apply all filters at database level first
    const rows = await prisma.daily_purchase.findMany({
      where: whereCondition,
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
    });

    if (!rows || rows.length === 0) {
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

    let groupedArray = Array.from(groupedMap.values());

    // Step 1: Determine sortKey based on commodity type and payment status
    groupedArray = groupedArray.map((group) => {
      let sortKey = 999; // default: last

      const isRestaurantOrLiquor =
        dvatCommodity === "RESTAURANT" || dvatCommodity === "LIQUOR";

      if (isRestaurantOrLiquor) {
        // For RESTAURANT or LIQUOR:
        // Yellow (PAID) = 0 (first)
        // Green (DEALER_PAID) = 2 (last)
        // Remaining = 1 (middle)

        const hasPaid = group.records.some(
          (record) => record.payment_status === "PAID",
        );
        if (hasPaid) {
          sortKey = 0; // yellow (first)
        } else {
          const hasDealerPaid = group.records.some(
            (record) => record.payment_status === "DEALER_PAID",
          );
          if (hasDealerPaid) {
            sortKey = 2; // green (last)
          } else {
            sortKey = 1; // remaining (middle)
          }
        }
      } else {
        // For other commodities (not RESTAURANT or LIQUOR):
        // Red (is_accept === false) = 0 (first)
        // Green (PAID or DEALER_PAID) = 2 (last)
        // Remaining = 1 (middle)

        const hasNotAccepted = group.records.some((record) => !record.is_accept);
        if (hasNotAccepted) {
          sortKey = 0; // red (first)
        } else {
          const hasPaidOrDealerPaid = group.records.some(
            (record) =>
              record.payment_status === "PAID" ||
              record.payment_status === "DEALER_PAID",
          );
          if (hasPaidOrDealerPaid) {
            sortKey = 2; // green (last)
          } else {
            sortKey = 1; // remaining (middle)
          }
        }
      }

      return { ...group, sortKey };
    }) as any;

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

    // Sort in memory: by payment status (yellow -> red -> green) only
    groupedArray.sort((a, b) => {
      // Sort by payment status (sortKey) only
      return (a as any).sortKey - (b as any).sortKey;
    });

    const filteredSummary = summarize(groupedArray);
    const totalCount = groupedArray.length;

    // Paginate after grouping, filtering, and sorting
    const paginatedGroups = groupedArray.slice(
      payload.skip,
      payload.skip + payload.take,
    );

    const summary: DailyPurchaseFilteredSummary = {
      overallSummary: filteredSummary,
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
