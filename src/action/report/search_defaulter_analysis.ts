"use server";

import { errorToString } from "@/utils/methods";
import { dvat04, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface ResponseType {
  dvat04: dvat04;
  lastfiling: string;
  pendingCount: number;
  defaultCount: number;
  lastYearDefaults: number;
}

interface SearchDefaulterAnalysisPayload {
  dept?: SelectOffice;
  arnnumber: string;
  tradename?: string;
  skip: number;
  take: number;
}

const SearchDefaulterAnalysis = async (
  payload: SearchDefaulterAnalysisPayload
): Promise<PaginationResponse<Array<ResponseType> | null>> => {
  const functionname: string = SearchDefaulterAnalysis.name;
  try {
    // Get all return filings with PENDINGFILING status
    const returnFilings = await prisma.return_filing.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        return_status: "PENDINGFILING",
        dvat: {
          ...(payload.dept && { selectOffice: payload.dept }),
          tinNumber: payload.arnnumber,
          ...(payload.tradename && {
            OR: [
              { tradename: { contains: payload.tradename } },
              { name: { contains: payload.tradename } },
            ],
          }),
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

    if (!returnFilings || returnFilings.length === 0) {
      return createPaginationResponse({
        message: "No defaulter data found",
        functionname,
        data: [],
        skip: payload.skip,
        take: payload.take,
        total: 0,
      });
    }

    let resMap = new Map<number, ResponseType>();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    for (let i = 0; i < returnFilings.length; i++) {
      const currentDvat: dvat04 = returnFilings[i].dvat;
      const filingMonth = monthNames.indexOf(returnFilings[i].month) + 1;
      const filingYear = parseInt(returnFilings[i].year);
      
      if (!returnFilings[i].due_date) continue;
      const dueDate = new Date(returnFilings[i].due_date!);

      if (currentDvat && dueDate < currentDate) {
        if (resMap.has(currentDvat.id)) {
          let existingData = resMap.get(currentDvat.id) as ResponseType;

          // Count total pending filings
          existingData.pendingCount += 1;
          
          // Count defaults (overdue filings)
          existingData.defaultCount += 1;

          // Count defaults in the past year
          if (dueDate >= oneYearAgo) {
            existingData.lastYearDefaults += 1;
          }

          // Update last filing with the most recent one
          const currentFilingStr = `${returnFilings[i].month}-${returnFilings[i].year}`;
          if (existingData.lastfiling === "N/A" || 
              (filingYear > parseInt(existingData.lastfiling.split('-')[1]) ||
               (filingYear === parseInt(existingData.lastfiling.split('-')[1]) && 
                filingMonth > monthNames.indexOf(existingData.lastfiling.split('-')[0]) + 1))) {
            existingData.lastfiling = currentFilingStr;
          }
        } else {
          const currentFilingStr = `${returnFilings[i].month}-${returnFilings[i].year}`;
          const lastYearDefault = dueDate >= oneYearAgo ? 1 : 0;

          resMap.set(currentDvat.id, {
            dvat04: currentDvat,
            lastfiling: currentFilingStr,
            pendingCount: 1,
            defaultCount: 1,
            lastYearDefaults: lastYearDefault,
          });
        }
      }
    }

    // Convert Map to array and filter dealers with 3+ defaults in the past year
    const res: ResponseType[] = Array.from(resMap.values())
      .filter((val: ResponseType) => val.lastYearDefaults >= 3)
      .sort((a, b) => b.defaultCount - a.defaultCount);

    const paginatedData = res.slice(payload.skip, payload.skip + payload.take);

    return createPaginationResponse({
      message: "Defaulter analysis data retrieved successfully",
      functionname,
      data: paginatedData,
      skip: payload.skip,
      take: payload.take,
      total: res.length ?? 0,
    });
  } catch (e) {
    const errorMessage = errorToString(e);

    return createPaginationResponse({
      message: errorMessage,
      functionname,
    });
  }
};

export default SearchDefaulterAnalysis;
