"use server";

import { errorToString } from "@/utils/methods";
import { cform, dvat04, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

interface CFormReportData {
  id: number;
  srNo: string;
  dateOfIssue: Date;
  sellerTinNo: string;
  sellerName: string;
  sellerAddress: string;
  amount: string;
  fromPeriod: Date;
  toPeriod: Date;
  cformType: string;
  officeOfIssue: string | null;
  purchaserName: string | null;
  purchaserTin: string | null;
  purchaserAddress: string | null;
  purchaserCommodity: string | null;
}

interface CFormReportResponse {
  status: boolean;
  data?: {
    allCForms: CFormReportData[];
    summary: {
      totalCForms: number;
      totalAmount: number;
      bySellerCount: Record<string, number>;
      bySellerAmount: Record<string, number>;
      byCommodityCount: Record<string, number>;
      byCommodityAmount: Record<string, number>;
      topSellers: Array<{
        name: string;
        tin: string;
        count: number;
        totalAmount: number;
      }>;
      topCommodities: Array<{
        name: string;
        count: number;
        totalAmount: number;
      }>;
      monthlyTrend: Array<{
        month: string;
        count: number;
        amount: number;
      }>;
    };
  };
  message: string;
  functionname: string;
}

const GetAllCFormReports = async (
  filters?: {
    startDate?: Date;
    endDate?: Date;
    sellerTin?: string;
    sellerName?: string;
    cformType?: string;
    office?: SelectOffice;
  }
): Promise<CFormReportResponse> => {
  const functionname: string = GetAllCFormReports.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        message: "Not authenticated. Please login.",
        functionname,
      };
    }

    // Fetch all C Forms for current user/department
    const cforms = await prisma.cform.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        ...(filters?.startDate && {
          date_of_issue: {
            gte: filters.startDate,
          },
        }),
        ...(filters?.endDate && {
          date_of_issue: {
            lte: filters.endDate,
          },
        }),
        ...(filters?.sellerTin && {
          seller_tin_no: {
            contains: filters.sellerTin,
          },
        }),
        ...(filters?.sellerName && {
          seller_name: {
            contains: filters.sellerName,
          },
        }),
        ...(filters?.cformType && {
          cform_type: filters.cformType as any,
        }),
        ...(filters?.office && {
          office_of_issue: filters.office,
        }),
      },
      include: {
        dvat04: true,
      },
      orderBy: {
        date_of_issue: "desc",
      },
    });

    // Transform data
    const transformedData: CFormReportData[] = cforms.map((form) => ({
      id: form.id,
      srNo: form.sr_no,
      dateOfIssue: form.date_of_issue,
      sellerTinNo: form.seller_tin_no,
      sellerName: form.seller_name,
      sellerAddress: form.seller_address,
      amount: form.amount,
      fromPeriod: form.from_period,
      toPeriod: form.to_period,
      cformType: form.cform_type,
      officeOfIssue: form.office_of_issue,
      purchaserName: form.dvat04?.name ?? null,
      purchaserTin: form.dvat04?.tinNumber ?? null,
      purchaserAddress: form.dvat04?.address ?? null,
      purchaserCommodity: form.dvat04?.commodity ?? null,
    }));

    // Calculate summary statistics
    const summary = {
      totalCForms: transformedData.length,
      totalAmount: transformedData.reduce((sum, item) => {
        const amount = parseFloat(item.amount) || 0;
        return sum + amount;
      }, 0),
      bySellerCount: {} as Record<string, number>,
      bySellerAmount: {} as Record<string, number>,
      byCommodityCount: {} as Record<string, number>,
      byCommodityAmount: {} as Record<string, number>,
      topSellers: [] as Array<{
        name: string;
        tin: string;
        count: number;
        totalAmount: number;
      }>,
      topCommodities: [] as Array<{
        name: string;
        count: number;
        totalAmount: number;
      }>,
      monthlyTrend: [] as Array<{
        month: string;
        count: number;
        amount: number;
      }>,
    };

    // Aggregate by seller
    transformedData.forEach((item) => {
      const sellerKey = `${item.sellerName} (${item.sellerTinNo})`;
      const amount = parseFloat(item.amount) || 0;

      summary.bySellerCount[sellerKey] =
        (summary.bySellerCount[sellerKey] || 0) + 1;
      summary.bySellerAmount[sellerKey] =
        (summary.bySellerAmount[sellerKey] || 0) + amount;
    });

    // Aggregate by commodity
    transformedData.forEach((item) => {
      if (item.purchaserCommodity) {
        const commodity = item.purchaserCommodity;
        const amount = parseFloat(item.amount) || 0;

        summary.byCommodityCount[commodity] =
          (summary.byCommodityCount[commodity] || 0) + 1;
        summary.byCommodityAmount[commodity] =
          (summary.byCommodityAmount[commodity] || 0) + amount;
      }
    });

    // Get top sellers
    summary.topSellers = Object.entries(summary.bySellerCount)
      .map(([key, count]) => {
        const [name, tin] = key.split(" (");
        return {
          name: name || "Unknown",
          tin: tin?.replace(")", "") || "N/A",
          count,
          totalAmount: summary.bySellerAmount[key] || 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top commodities
    summary.topCommodities = Object.entries(summary.byCommodityCount)
      .map(([name, count]) => ({
        name,
        count,
        totalAmount: summary.byCommodityAmount[name] || 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Monthly trend
    const monthlyMap = new Map<
      string,
      { count: number; amount: number }
    >();
    transformedData.forEach((item) => {
      const monthKey = new Date(item.dateOfIssue).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      const amount = parseFloat(item.amount) || 0;

      if (monthlyMap.has(monthKey)) {
        const existing = monthlyMap.get(monthKey)!;
        existing.count += 1;
        existing.amount += amount;
      } else {
        monthlyMap.set(monthKey, { count: 1, amount });
      }
    });

    summary.monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        amount: data.amount,
      }))
      .reverse();

    return {
      status: true,
      data: {
        allCForms: transformedData,
        summary,
      },
      message: "C-Form reports fetched successfully",
      functionname,
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
      functionname,
    };
  }
};

export default GetAllCFormReports;
