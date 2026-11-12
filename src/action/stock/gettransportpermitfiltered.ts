"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";
import { getCurrentUserId, getCurrentDvatId, getCurrentUser } from "@/lib/auth";

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
  statusFilter?: "all" | "paid" | "unpaid" | "released";
  officeFilter?: "all" | "Dadra_Nagar_Haveli" | "DAMAN" | "DIU";
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
  office: string;
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
  pendingRecords?: number;
  paidRecords?: number;
};

const ZERO_SUMMARY: TransportPermitSummary = {
  totalRecords: 0,
  totalItems: 0,
  pendingRecords: 0,
  paidRecords: 0,
};

const summarize = (records: TransportPermitRecord[]): TransportPermitSummary => ({
  totalRecords: records.length,
  totalItems: records.reduce((sum, record) => sum + record.items, 0),
  pendingRecords: records.filter((r) => !r.is_paid).length,
  paidRecords: records.filter((r) => r.is_paid).length,
});

const GetTransportPermitFiltered = async (
  payload: GetTransportPermitFilteredPayload,
): Promise<PaginationResponse<Array<TransportPermitRecord>>> => {
  const functionname: string = GetTransportPermitFiltered.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    const currentUser = await getCurrentUser();
    
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

    const searchTerm = (payload.searchTerm ?? "").trim().toLowerCase();
    const statusFilter = payload.statusFilter ?? "all";
    
    // Determine office filter based on user role
    let effectiveOfficeFilter = payload.officeFilter ?? "all";
    if (currentUser && currentUser.role !== "ADMIN") {
      effectiveOfficeFilter = currentUser.selectOffice || "Dadra_Nagar_Haveli";
    }

    // Apply search term filter
    if (searchTerm !== "") {
      whereCondition.OR = [
        { invoiceNumber: { contains: searchTerm, mode: "insensitive" } },
        { sellerDvatTradeName: { contains: searchTerm, mode: "insensitive" } },
        { sellerDvatTinNumber: { contains: searchTerm, mode: "insensitive" } },
        { purchaserDvatTradeName: { contains: searchTerm, mode: "insensitive" } },
        { purchaserDvatTinNumber: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    // Apply office filter
    if (effectiveOfficeFilter !== "all") {
      whereCondition.office = effectiveOfficeFilter;
    }

    // Apply status filter
    if (statusFilter === "paid") {
      whereCondition.is_paid = true;
    } else if (statusFilter === "unpaid") {
      whereCondition.is_paid = false;
    } else if (statusFilter === "released") {
      whereCondition.tp_released = true;
    }

    const sortField: TransportPermitSortField =
      payload.sortField ?? "invoiceDate";
    const sortOrder: TransportPermitSortOrder = payload.sortOrder ?? "desc";

    // Build orderBy with is_paid first, then the selected field
    const orderByCondition: any[] = [
      { is_paid: "desc" }, // true (paid) on top, false (unpaid) on bottom
    ];

    switch (sortField) {
      case "invoiceNumber":
        orderByCondition.push({ invoiceNumber: sortOrder });
        break;
      case "invoiceDate":
        orderByCondition.push({ invoiceDate: sortOrder });
        break;
      case "sellerDvatTradeName":
        orderByCondition.push({ sellerDvatTradeName: sortOrder });
        break;
      case "purchaserDvatTradeName":
        orderByCondition.push({ purchaserDvatTradeName: sortOrder });
        break;
      case "items":
        orderByCondition.push({ items: sortOrder });
        break;
    }

    // Fetch paginated data with all filters and sorting applied at database level
    const transportPermitRows = await prisma.transport_permit.findMany({
      where: whereCondition,
      orderBy: orderByCondition,
      take: payload.take,
      skip: payload.skip,
    });

    if (!transportPermitRows || transportPermitRows.length === 0) {
      return createPaginationResponse({
        message: "No Transport Permit records found. Please try again.",
        functionname,
      });
    }

    // Get total count for pagination info
    const totalCount = await prisma.transport_permit.count({
      where: whereCondition,
    });

    const filteredSummary = summarize(transportPermitRows);
    const summary = {
      filteredSummary,
      totalRecords: totalCount,
    };

    return createPaginationResponse({
      message: "Transport Permit data fetched successfully.",
      functionname,
      data: transportPermitRows,
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
