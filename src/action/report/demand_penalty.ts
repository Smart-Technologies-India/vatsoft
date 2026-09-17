"use server";

import { errorToString } from "@/utils/methods";
import { dvat04, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId } from "@/lib/auth";

interface ResponseType {
  dvat04: dvat04;
  pending: number;
  lastfiling: string;
  vatamount: number;
}

interface DemandPenaltyPayload {
  arnnumber?: string;
  tradename?: string;
  commodity?: string;
  frequency?: string;
  dealerType?: string;
  dept?: SelectOffice | "ALL";
  skip: number;
  take: number;
}

const DemandPenalty = async (
  payload: DemandPenaltyPayload
): Promise<PaginationResponse<Array<ResponseType> | null>> => {
  const functionname: string = DemandPenalty.name;
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "DemandPenalty",
      } as any;
    }

    // Get data from return_filing table
    const returnFilingResponse = await prisma.return_filing.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat: {
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
          ...(payload.dept && payload.dept !== "ALL" && { selectOffice: payload.dept }),
          deletedAt: null,
          deletedBy: null,
        },
      },
      include: {
        dvat: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!returnFilingResponse)
      return createPaginationResponse({
        message: "There is no returns data",
        functionname,
      });

    // Filter by commodity and frequency
    let filteredReturns = returnFilingResponse;
    if (payload.commodity) {
      filteredReturns = filteredReturns.filter(
        (item: any) => item.dvat?.commodity === payload.commodity,
      );
    }
    if (payload.frequency) {
      filteredReturns = filteredReturns.filter(
        (item: any) => item.dvat?.frequencyFilings === payload.frequency,
      );
    }

    // Build map of dealers with their pending returns and last filing info
    let resMap = new Map<number, ResponseType>();
    const currentDate = new Date();

    for (const filing of filteredReturns) {
      const dvat04Id = filing.dvat.id;
      const currentLastFiling = `${filing.month}-${filing.year}`;
      const filingStatus = filing.filing_status;
      const dueDate = filing.due_date ? new Date(filing.due_date) : null;

      if (!resMap.has(dvat04Id)) {
        resMap.set(dvat04Id, {
          dvat04: filing.dvat,
          pending: 0,
          lastfiling: "N/A",
          vatamount: 0,
        });
      }

      const dealerData = resMap.get(dvat04Id)!;

      // Count pending returns (overdue filings)
      if (!filingStatus && dueDate && dueDate < currentDate) {
        dealerData.pending += 1;
      } else if (filingStatus) {
        dealerData.lastfiling = currentLastFiling;
      }
    }

    // Convert Map to array
    let res: ResponseType[] = Array.from(resMap.values());

    // Get VAT amount from daily_purchase table for each dealer
    for (const response of res) {
      const vatAmountRecords = await prisma.daily_purchase.findMany({
        where: {
          dvat04Id: response.dvat04.id,
          deletedAt: null,
        },
        select: {
          amount: true,
          commodity_master: {
            select: {
              id: true,
            },
          },
        },
      });

      // Calculate vatamount based on commodity id and amount
      let totalVatAmount = 0;
      for (const record of vatAmountRecords) {
        const amount = parseFloat(record.amount);
        const commodityId = record.commodity_master?.id;

        if (!isNaN(amount)) {
          let vatRate = 0.2; // Default 20%

          // If commodity id = 1 or 748: 12.75%
          if (commodityId === 1 || commodityId === 748) {
            vatRate = 0.1275;
          }
          // If commodity id = 2 or 749: 12.75%
          else if (commodityId === 2 || commodityId === 749) {
            vatRate = 0.1275;
          }

          totalVatAmount += amount * vatRate;
        }
      }
      response.vatamount = totalVatAmount;
    }

    // Sort by pending count (descending) and then by VAT amount (descending)
    res.sort((a, b) => {
      if (b.pending !== a.pending) {
        return b.pending - a.pending;
      }
      return b.vatamount - a.vatamount;
    });

    // Pagination
    const totalCount = res.length;
    const paginatedRes = res.slice(
      payload.skip,
      payload.skip + payload.take
    );

    return createPaginationResponse({
      data: paginatedRes,
      message: "Demand Penalty data retrieved successfully",
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

export default DemandPenalty;
