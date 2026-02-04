"use server";

import { errorToString } from "@/utils/methods";
import { dvat04, return_filing, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface ResponseType {
  dvat04: dvat04;
  returnfiling: return_filing[];
  lastfiling: string;
  pendingCount: number;
  defaultCount: number;
  lastYearDefaults: number;
}

interface DefaulterAnalysisPayload {
  dept?: SelectOffice;
  arnnumber?: string;
  tradename?: string;
  skip: number;
  take: number;
}

const DefaulterAnalysis = async (
  payload: DefaulterAnalysisPayload,
): Promise<PaginationResponse<Array<ResponseType> | null>> => {
  const functionname: string = DefaulterAnalysis.name;
  try {
    // Get all return filings with PENDINGFILING status
    const returnFilings = await prisma.return_filing.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        dvat: {
          ...(payload.dept && { selectOffice: payload.dept }),
          ...(payload.arnnumber && { tinNumber: payload.arnnumber }),
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

    let resTempMap = new Map<number, ResponseType>();

    for (let i = 0; i < returnFilings.length; i++) {
      const currentDvat: dvat04 = returnFilings[i].dvat;
      if (resTempMap.has(currentDvat.id)) {
        let existingData: ResponseType = resTempMap.get(
          currentDvat.id,
        ) as ResponseType;

        // If dvat already exists
        existingData.returnfiling.push(returnFilings[i]);
      } else {
        resTempMap.set(currentDvat.id, {
          returnfiling: [returnFilings[i]],
          dvat04: currentDvat,
          lastfiling: "N/A",
          pendingCount: 0,
          defaultCount: 0,
          lastYearDefaults: 0,
        });
      }
    }

    let resMap = new Map<number, ResponseType>();

    const tempRes: ResponseType[] = Array.from(resTempMap.values());

    for (let i = 0; i < tempRes.length; i++) {
      let resItem = tempRes[i];
      // if filing_status is false  return_status PENDINGFILING
      let pendingCount = resItem.returnfiling.filter(
        (rf) =>
          rf.filing_status === false && rf.return_status === "PENDINGFILING",
      ).length;
      // return_filing total entries and return_status expect DUE
      let defaultCount = resItem.returnfiling.filter(
        (rf) => rf.return_status !== "DUE" && rf.filing_status === false,
      ).length;
      // return_filing in last 12 entring with filing_status false and return_status PENDINGFILING
      let lastYearDefaults = resItem.returnfiling
        .filter(
          (rf) =>
            rf.filing_status === false && rf.return_status === "PENDINGFILING",
        )
        .splice(-12).length;

      let lastfiling = "N/A";
      const lastFilingEntry = resItem.returnfiling
        .filter((rf) => rf.filing_status === true)
        .splice(-1);
      if (lastFilingEntry.length > 0) {
        lastfiling = `${lastFilingEntry[0].month}-${lastFilingEntry[0].year}`;
      }
      let lastFilingDate: string = lastfiling;

      resMap.set(resItem.dvat04.id, {
        dvat04: resItem.dvat04,
        returnfiling: [],
        pendingCount: pendingCount,
        defaultCount: defaultCount,
        lastYearDefaults: lastYearDefaults,
        lastfiling: lastFilingDate,
      });
    }


    // // Convert Map to array and filter dealers with 3+ defaults in the past year
    const res: ResponseType[] = Array.from(resMap.values())
      .filter((val: ResponseType) => val.lastYearDefaults >= 3)
      .sort((a, b) => b.pendingCount - a.pendingCount);

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

export default DefaulterAnalysis;
