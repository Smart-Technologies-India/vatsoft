"use server";

import prisma from "../../../prisma/database";

export interface SearchRefundParams {
  search?: string;
  status?: string;
  returnStatus?: string;
  skip: number;
  take: number;
}

export interface SearchRefundResponse {
  status: boolean;
  data?: Array<{
    id: number;
    dvatId: number;
    returnId: number;
    itc_amount: string;
    cash_amount: string;
    remark: string | null;
    status: string;
    created_at: Date;
    dvat_name: string;
    dvat_tin: string;
    rr_number: string;
    return_month: string | null;
    return_quarter: string | null;
    return_year: string;
    return_status: string;
    total_tax_amount: string | null;
    filing_datetime: Date | null;
  }>;
  total?: number;
  message?: string;
}

export default async function SearchWalletRefunds(
  params: SearchRefundParams
): Promise<SearchRefundResponse> {
  try {
    const { search = "", status = "", returnStatus = "", skip, take } = params;

    // Build where clause
    const where: any = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        {
          dvat: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          dvat: {
            tinNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          returns_01: {
            rr_number: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (returnStatus) {
      where.returns_01 = {
        status: returnStatus,
      };
    }

    // Get total count
    const total = await prisma.wallet_refund.count({ where });

    // Get paginated data with custom sorting: DUE first, then APPROVED, then REJECTED
    const walletRefunds = await prisma.wallet_refund.findMany({
      where,
      include: {
        dvat: true,
        returns_01: true,
      },
      orderBy: [
        {
          status: "asc", // This will sort alphabetically: APPROVED, DUE, REJECTED
        },
        {
          created_at: "desc", // Then by creation date (newest first)
        },
      ],
      skip,
      take,
    });

    // Sort to get DUE first, then APPROVED, then REJECTED
    const statusOrder: { [key: string]: number } = {
      "DUE": 0,
      "APPROVED": 1,
      "REJECTED": 2,
    };

    const sortedRefunds = walletRefunds.sort((a, b) => {
      const orderA = statusOrder[a.status] ?? 999;
      const orderB = statusOrder[b.status] ?? 999;
      return orderA - orderB;
    });

    const formattedData = sortedRefunds.map((refund: any) => ({
      id: refund.id,
      dvatId: refund.dvatId,
      returnId: refund.returnId,
      itc_amount: refund.itc_amount,
      cash_amount: refund.cash_amount,
      remark: refund.remark,
      status: refund.status,
      created_at: refund.created_at,
      dvat_name: refund.dvat?.name || "N/A",
      dvat_tin: refund.dvat?.tinNumber || "N/A",
      rr_number: refund.returns_01?.rr_number || "N/A",
      return_month: refund.returns_01?.month || null,
      return_quarter: (refund.returns_01?.quarter as string) || null,
      return_year: refund.returns_01?.year || "N/A",
      return_status: refund.returns_01?.status || "N/A",
      total_tax_amount: refund.returns_01?.total_tax_amount || null,
      filing_datetime: refund.returns_01?.filing_datetime || null,
    }));

    return {
      status: true,
      data: formattedData,
      total,
    };
  } catch (error) {
    console.error("Error searching wallet refunds:", error);
    return {
      status: false,
      message: "Failed to search refund requests",
    };
  }
}
