"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { getCurrentUserId, getCurrentDvatId, getCurrentUser } from "@/lib/auth";

interface GetTransportPermitSummaryPayload {
  startDate?: string;
  endDate?: string;
  statusFilter?: "all" | "paid" | "unpaid" | "released";
  officeFilter?: "all" | "Dadra_Nagar_Haveli" | "DAMAN" | "DIU";
  searchTerm?: string;
}

export type TransportPermitSummary = {
  totalRecords: number;
  totalItems: number;
  pendingRecords: number;
  paidRecords: number;
};

const ZERO_SUMMARY: TransportPermitSummary = {
  totalRecords: 0,
  totalItems: 0,
  pendingRecords: 0,
  paidRecords: 0,
};

const GetTransportPermitSummary = async (
  payload: GetTransportPermitSummaryPayload,
): Promise<{
  status: boolean;
  data: TransportPermitSummary | null;
  message: string;
  functionname: string;
}> => {
  const functionname: string = GetTransportPermitSummary.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    const currentUser = await getCurrentUser();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      };
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
        { invoiceNumber: { contains: searchTerm } },
        { sellerDvatTradeName: { contains: searchTerm } },
        { sellerDvatTinNumber: { contains: searchTerm } },
        { purchaserDvatTradeName: { contains: searchTerm } },
        { purchaserDvatTinNumber: { contains: searchTerm } },
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

    // Fetch ALL matching records (without pagination) to calculate accurate summary
    const allTransportPermitRows = await prisma.transport_permit.findMany({
      where: whereCondition,
      select: {
        id: true,
        is_paid: true,
        items: true,
      },
    });

    if (!allTransportPermitRows || allTransportPermitRows.length === 0) {
      return {
        status: true,
        data: ZERO_SUMMARY,
        message: "No Transport Permit records found.",
        functionname,
      };
    }

    // Calculate summary from all matching records
    const summary: TransportPermitSummary = {
      totalRecords: allTransportPermitRows.length,
      totalItems: allTransportPermitRows.reduce(
        (sum, record) => sum + record.items,
        0,
      ),
      paidRecords: allTransportPermitRows.filter((r) => r.is_paid).length,
      pendingRecords: allTransportPermitRows.filter((r) => !r.is_paid).length,
    };

    return {
      status: true,
      data: summary,
      message: "Transport Permit summary fetched successfully.",
      functionname,
    };
  } catch (e) {
    return {
      status: false,
      data: null,
      message: errorToString(e),
      functionname,
    };
  }
};

export default GetTransportPermitSummary;
