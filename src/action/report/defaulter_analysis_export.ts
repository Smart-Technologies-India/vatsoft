"use server";
import { getCurrentUserId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { dvat04, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import { ApiResponseType } from "@/models/response";

interface ResponseType {
  dvat04: dvat04;
  lastfiling: string;
  pendingCount: number;
  defaultCount: number;
  lastYearDefaults: number;
}

interface DefaulterAnalysisExportPayload {
  dept?: SelectOffice;
  arnnumber?: string;
  tradename?: string;
}

const DefaulterAnalysisExport = async (
  payload: DefaulterAnalysisExportPayload,
): Promise<ApiResponseType<Array<ResponseType> | null>> => {
  const functionname: string = DefaulterAnalysisExport.name;
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "DefaulterAnalysisExport",
      } as any;
    }

    // Get all return filings (regardless of status)
    const returnFilings = await prisma.return_filing.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
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
      return {
        status: true,
        message: "No defaulter data found",
        functionname,
        data: [],
      };
    }

    let resTempMap = new Map<number, ResponseType>();

    for (let i = 0; i < returnFilings.length; i++) {
      const currentDvat: dvat04 = returnFilings[i].dvat;
      if (resTempMap.has(currentDvat.id)) {
        let existingData: ResponseType = resTempMap.get(
          currentDvat.id,
        ) as ResponseType;

        // If dvat already exists
        existingData.pendingCount += 1;
      } else {
        resTempMap.set(currentDvat.id, {
          dvat04: currentDvat,
          lastfiling: "N/A",
          pendingCount: 0,
          defaultCount: 0,
          lastYearDefaults: 0,
        });
      }
    }

    let resMap = new Map<number, ResponseType>();
    const currentDate = new Date();

    // Quarter to months mapping
    const quarterMonthsMap: Record<string, string[]> = {
      QUARTER1: ["April", "May", "June"],
      QUARTER2: ["July", "August", "September"],
      QUARTER3: ["October", "November", "December"],
      QUARTER4: ["January", "February", "March"],
    };

    // Get last month of each quarter
    const getLastMonthOfQuarter = (month: string): string => {
      for (const [quarter, months] of Object.entries(quarterMonthsMap)) {
        if (months.includes(month)) {
          return months[months.length - 1]; // Return last month of quarter
        }
      }
      return month; // Return as is if not found
    };

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    for (let i = 0; i < returnFilings.length; i++) {
      const filing = returnFilings[i];
      const currentDvat: dvat04 = filing.dvat;
      const filingMonth = monthNames.indexOf(filing.month) + 1;
      const filingYear = parseInt(filing.year);

      if (!resMap.has(currentDvat.id)) {
        resMap.set(currentDvat.id, {
          dvat04: currentDvat,
          lastfiling: "N/A",
          pendingCount: 0,
          defaultCount: 0,
          lastYearDefaults: 0,
        });
      }

      const resItem = resMap.get(currentDvat.id) as ResponseType;
      const filingStatus = filing.filing_status;
      const currentLastFiling = `${filing.month}-${filing.year}`;
      const dueDate = filing.due_date ? new Date(filing.due_date) : null;

      if (filingStatus) {
        if (
          resItem.lastfiling === "N/A" ||
          filingYear > parseInt(resItem.lastfiling.split("-")[1]) ||
          (filingYear === parseInt(resItem.lastfiling.split("-")[1]) &&
            filingMonth >
              monthNames.indexOf(resItem.lastfiling.split("-")[0]) + 1)
        ) {
          resItem.lastfiling = currentLastFiling;
        }
      } else if (dueDate && dueDate < currentDate) {
        const isQuarterly = currentDvat.frequencyFilings === "QUARTERLY";
        
        // For quarterly filing, only count if it's the last month of the quarter
        if (isQuarterly) {
          const lastMonthOfQuarter = getLastMonthOfQuarter(filing.month);
          if (filing.month === lastMonthOfQuarter) {
            resItem.pendingCount += 1;
          }
        } else {
          // For monthly filing, count every overdue month
          resItem.pendingCount += 1;
        }
      }

      // Count all unfiled returns as defaults
      resItem.defaultCount = returnFilings
        .filter((rf) => rf.dvat.id === currentDvat.id && rf.filing_status === false)
        .length;

      // Count defaults in last 12 entries
      resItem.lastYearDefaults = returnFilings
        .filter((rf) => rf.dvat.id === currentDvat.id && rf.filing_status === false)
        .slice(-12).length;
    }

    // Convert Map to array and filter dealers with 3+ defaults in the past year
    // Return ALL data without pagination
    const res: ResponseType[] = Array.from(resMap.values())
      .filter((val: ResponseType) => val.lastYearDefaults >= 3)
      .sort((a, b) => b.defaultCount - a.defaultCount);

    return {
      status: true,
      message: "Defaulter analysis export data retrieved successfully",
      functionname,
      data: res,
    };
  } catch (e) {
    const errorMessage = errorToString(e);

    return {
      status: false,
      message: errorMessage,
      functionname,
      data: null,
    };
  }
};

export default DefaulterAnalysisExport;
