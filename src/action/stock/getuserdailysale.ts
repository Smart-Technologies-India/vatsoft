"use server";

import { errorToString } from "@/utils/methods";
import {
  commodity_master,
  daily_sale,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface GetUserDailySalePayload {
  dvatid: number;
  take: number;
  skip: number;
}

export type GroupedDailySale = {
  invoice_number: string;
  invoice_date: Date;
  seller_tin_id: number;
  seller_tin_number: tin_number_master;
  records: Array<
    daily_sale & {
      commodity_master: commodity_master;
      seller_tin_number: tin_number_master;
    }
  >;
  count: number;
  totalTaxableValue: number;
  totalVatAmount: number;
  totalInvoiceValue: number;
  urn_number: string;
};

export type DailySaleSummary = {
  totalInvoices: number;
  totalTaxableValue: number;
  totalVatAmount: number;
  totalInvoiceValue: number;
};

const GetUserDailySale = async (
  payload: GetUserDailySalePayload,
): Promise<PaginationResponse<Array<GroupedDailySale> | null>> => {
  const functionname: string = GetUserDailySale.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetUserDailySale",
      } as any;
    }

    // Step 1: Get distinct invoice groups with payment status
    const allDistinctInvoices = await prisma.daily_sale.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        is_dvat_31: false,
        dvat04Id: payload.dvatid,
      },
      select: {
        invoice_number: true,
        invoice_date: true,
        seller_tin_numberId: true,
        is_paid: true,
      },
      distinct: ["invoice_number", "invoice_date", "seller_tin_numberId"],
    });

    if (!allDistinctInvoices || allDistinctInvoices.length === 0) {
      return createPaginationResponse({
        message: "No Daily sale found. Please try again.",
        functionname,
      });
    }

    // Step 2: Determine payment status for each invoice group and sort
    // Red (not paid) first, then Green (paid)
    const invoiceGroups = allDistinctInvoices.map((inv) => {
      let sortKey = 1; // default: green (paid)
      
      if (!inv.is_paid) {
        sortKey = 0; // red (not paid) - comes first
      }
      
      return {
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        seller_tin_numberId: inv.seller_tin_numberId,
        is_paid: inv.is_paid,
        sortKey,
      };
    });

    // Sort by: red first (0), then green (1), then by date
    invoiceGroups.sort((a, b) => {
      if (a.sortKey !== b.sortKey) {
        return a.sortKey - b.sortKey;
      }
      return new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime();
    });

    const totalCount = invoiceGroups.length;

    // Step 3: Get paginated invoice groups
    const paginatedInvoices = invoiceGroups.slice(
      payload.skip,
      payload.skip + payload.take,
    );

    // Step 4: Fetch all records for the paginated invoices
    const daily_sale_response = await prisma.daily_sale.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        is_dvat_31: false,
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
      orderBy: [{ invoice_date: "desc" }, { invoice_number: "desc" }],
    });

    if (!daily_sale_response || daily_sale_response.length === 0) {
      return createPaginationResponse({
        message: "No Daily sale found. Please try again.",
        functionname,
      });
    }

    // Step 5: Group the fetched records
    const groupedMap = new Map<string, GroupedDailySale>();

    daily_sale_response.forEach((record) => {
      const key = `${record.invoice_number}_${record.invoice_date.toISOString()}_${record.seller_tin_numberId}`;

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.records.push(record);
        existing.count++;
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

    // Return groups in sorted order (from paginatedInvoices)
    const paginatedGroups = paginatedInvoices.map((inv) => {
      const key = `${inv.invoice_number}_${inv.invoice_date.toISOString()}_${inv.seller_tin_numberId}`;
      return groupedMap.get(key)!;
    });

    const summary: DailySaleSummary = paginatedGroups.reduce(
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
      message: "All Daily sale Data get successfully",
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

export default GetUserDailySale;
