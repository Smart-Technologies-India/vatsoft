"use server";

import { errorToString } from "@/utils/methods";
import { dvat04, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId } from "@/lib/auth";

interface NotfiledResponseType {
  dvat04: dvat04;
  pending: number;
  vatamount: string;
  interest: string;
  penalty: string;
  total: string;
}

interface NotfiledReportPayload {
  arnnumber?: string;
  tradename?: string;
  commodity?: string;
  frequency?: string;
  dealerType?: string;
  dept?: SelectOffice | "ALL";
  skip: number;
  take: number;
}

const NotfiledReturnsReport = async (
  payload: NotfiledReportPayload,
): Promise<PaginationResponse<Array<NotfiledResponseType> | null>> => {
  const functionname: string = NotfiledReturnsReport.name;
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "NotfiledReturnsReport",
      } as any;
    }

    // Get data from returns_notfiled_work table
    const notfiledData = await prisma.returns_notfiled_work.findMany({
      where: {
        dvat04: {
          ...(payload.arnnumber && { tinNumber: payload.arnnumber }),
          ...(payload.tradename && {
            OR: [
              { tradename: { contains: payload.tradename } },
              { name: { contains: payload.tradename } },
            ],
          }),
          ...(payload.dealerType && {
            compositionScheme: payload.dealerType === "COMPOSITION",
          }),
          ...(payload.dept && payload.dept !== "ALL" && { selectOffice: payload.dept as SelectOffice }),
          deletedAt: null,
          deletedBy: null,
        },
      },
      include: {
        dvat04: true,
      },
    });

    if (!notfiledData)
      return createPaginationResponse({
        message: "There is no unfiled returns data",
        functionname,
      });

    // Filter by commodity and frequency
    let filteredReturns = notfiledData;
    if (payload.commodity) {
      filteredReturns = filteredReturns.filter(
        (item: any) => item.dvat04?.commodity === payload.commodity,
      );
    }
    if (payload.frequency) {
      filteredReturns = filteredReturns.filter(
        (item: any) => item.dvat04?.frequencyFilings === payload.frequency,
      );
    }

    // Build response array with unique dealers
    let resMap = new Map<number, NotfiledResponseType>();

    for (const filing of filteredReturns) {
      const dvat04Id = filing.dvat04.id;

      if (!resMap.has(dvat04Id)) {
        resMap.set(dvat04Id, {
          dvat04: filing.dvat04,
          pending: 1,
          vatamount: filing.vatamount || "0",
          interest: filing.interest || "0",
          penalty: filing.penalty || "0",
          total: filing.total_tax_amount || "0",
        });
      } else {
        // If dealer already exists, sum up the values and increment pending count
        const existing = resMap.get(dvat04Id)!;
        existing.pending = existing.pending + 1;
        existing.vatamount = (
          parseFloat(existing.vatamount) + parseFloat(filing.vatamount || "0")
        ).toFixed(2);
        existing.interest = (
          parseFloat(existing.interest) + parseFloat(filing.interest || "0")
        ).toFixed(2);
        existing.penalty = (
          parseFloat(existing.penalty) + parseFloat(filing.penalty || "0")
        ).toFixed(2);
        existing.total = (
          parseFloat(existing.total) +
          parseFloat(filing.total_tax_amount || "0")
        ).toFixed(2);
      }
    }

    // Convert Map to array
    let res: NotfiledResponseType[] = Array.from(resMap.values());

    // Sort by total (descending)
    res.sort((a, b) => {
      return parseFloat(b.total) - parseFloat(a.total);
    });

    // Pagination
    const totalCount = res.length;
    const paginatedRes = res.slice(payload.skip, payload.skip + payload.take);

    return createPaginationResponse({
      data: paginatedRes,
      message: "Notfiled returns data retrieved successfully",
      functionname,
      allData: res,
      skip: payload.skip,
      take: payload.take,
      total: totalCount,
    });
  } catch (error) {
    return {
      status: false,
      data: null,
      message: errorToString(error),
      functionname,
    } as any;
  }
};

export default NotfiledReturnsReport;
