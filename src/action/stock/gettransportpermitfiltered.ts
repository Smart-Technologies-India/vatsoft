"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

export type TransportPermitSortField =
  | "invoiceNumber"
  | "invoiceDate"
  | "sellerDvatTradeName"
  | "purchaserDvatTradeName"
  | "items";

export type TransportPermitSortOrder = "asc" | "desc";

interface GetTransportPermitFilteredPayload {
  take: number;
  skip: number;
  searchTerm?: string;
  sortField?: TransportPermitSortField;
  sortOrder?: TransportPermitSortOrder;
  startDate?: string;
  endDate?: string;
}

export type TransportPermitRecord = {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  sellerDvatTradeName: string;
  sellerDvatTinNumber: string;
  purchaserDvatTradeName: string;
  purchaserDvatTinNumber: string;
  items: number;
  status: string;
  remark?: string | null;
  tp_released: boolean;
  is_paid: boolean;
  is_wallet: boolean;
  paid_date?: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
};

type TransportPermitSummary = {
  totalRecords: number;
  totalItems: number;
};

const ZERO_SUMMARY: TransportPermitSummary = {
  totalRecords: 0,
  totalItems: 0,
};

const summarize = (records: TransportPermitRecord[]): TransportPermitSummary => ({
  totalRecords: records.length,
  totalItems: records.reduce((sum, record) => sum + record.items, 0),
});

const GetTransportPermitFiltered = async (
  payload: GetTransportPermitFilteredPayload,
): Promise<PaginationResponse<Array<TransportPermitRecord>>> => {
  const functionname: string = GetTransportPermitFiltered.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetTransportPermitFiltered",
      } as any;
    }

    const whereCondition: any = {
      deleted_at: null,
      status: "ACTIVE",
      tp_released: false,
    };

    if (payload.startDate || payload.endDate) {
      const dateFilter: any = {};
      if (payload.startDate) {
        dateFilter.gte = new Date(payload.startDate);
      }
      if (payload.endDate) {
        dateFilter.lt = new Date(payload.endDate);
      }
      whereCondition.invoiceDate = dateFilter;
    }

    const transportPermitRows = await prisma.transport_permit.findMany({
      where: whereCondition,
      orderBy: [{ invoiceDate: "desc" }, { invoiceNumber: "desc" }],
    });

    if (!transportPermitRows) {
      return createPaginationResponse({
        message: "No Transport Permit records found. Please try again.",
        functionname,
      });
    }

    const searchTerm = (payload.searchTerm ?? "").trim().toLowerCase();
    const sortField: TransportPermitSortField =
      payload.sortField ?? "invoiceDate";
    const sortOrder: TransportPermitSortOrder = payload.sortOrder ?? "desc";

    let filtered = [...transportPermitRows];

    if (searchTerm !== "") {
      filtered = filtered.filter(
        (record) =>
          record.invoiceNumber.toLowerCase().includes(searchTerm) ||
          record.sellerDvatTradeName.toLowerCase().includes(searchTerm) ||
          record.sellerDvatTinNumber.includes(searchTerm) ||
          record.purchaserDvatTradeName.toLowerCase().includes(searchTerm) ||
          record.purchaserDvatTinNumber.includes(searchTerm),
      );
    }

    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case "invoiceNumber":
          compareValue = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case "invoiceDate":
          compareValue =
            new Date(a.invoiceDate).getTime() -
            new Date(b.invoiceDate).getTime();
          break;
        case "sellerDvatTradeName":
          compareValue = a.sellerDvatTradeName.localeCompare(
            b.sellerDvatTradeName,
          );
          break;
        case "purchaserDvatTradeName":
          compareValue = a.purchaserDvatTradeName.localeCompare(
            b.purchaserDvatTradeName,
          );
          break;
        case "items":
          compareValue = a.items - b.items;
          break;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    const overallSummary = summarize(filtered);
    const totalCount = filtered.length;

    const paginatedRecords = filtered.slice(
      payload.skip,
      payload.skip + payload.take,
    );

    const filteredSummary = summarize(paginatedRecords);

    const summary = {
      overallSummary,
      filteredSummary,
    };

    return createPaginationResponse({
      message: "Transport Permit data fetched successfully.",
      functionname,
      data: paginatedRecords,
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

export default GetTransportPermitFiltered;
