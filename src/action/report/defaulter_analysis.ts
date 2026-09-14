"use server";

import { errorToString } from "@/utils/methods";
import { dvat04, return_filing, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId } from "@/lib/auth";
interface ResponseType {
  dvat04: dvat04;
  returnfiling: return_filing[];
  lastfiling: string;
  pendingCount: number;
  defaultCount: number;
  lastYearDefaults: number;
  hasSale: boolean;
  hasPurchase: boolean;
  pendingMonth?: string;
  pendingYear?: string;
  isQuarterly?: boolean;
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
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "DefaulterAnalysis",
      } as any;
    }

    // Get all return filings with PENDINGFILING status
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
          hasSale: false,
          hasPurchase: false,
          pendingMonth: "",
          pendingYear: "",
          isQuarterly: currentDvat.frequencyFilings === "QUARTERLY",
        });
      }
    }

    let resMap = new Map<number, ResponseType>();

    const tempRes: ResponseType[] = Array.from(resTempMap.values());
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

    for (let i = 0; i < tempRes.length; i++) {
      let resItem = tempRes[i];
      let lastfiling = "N/A";
      let pendingCount = 0;
      let defaultCount = 0;
      let lastYearDefaults = 0;
      let pendingMonth = "";
      let pendingYear = "";
      const isQuarterly = resItem.dvat04.frequencyFilings === "QUARTERLY";

      for (let j = 0; j < resItem.returnfiling.length; j++) {
        const filing = resItem.returnfiling[j];
        const filingStatus = filing.filing_status;
        const currentLastFiling = `${filing.month}-${filing.year}`;
        const dueDate = filing.due_date ? new Date(filing.due_date) : null;

        if (filingStatus) {
          lastfiling = currentLastFiling;
        } else if (dueDate && dueDate < currentDate) {
          // For quarterly filing, only count if it's the last month of the quarter
          if (isQuarterly) {
            const lastMonthOfQuarter = getLastMonthOfQuarter(filing.month);
            if (filing.month === lastMonthOfQuarter) {
              pendingCount += 1;
              pendingMonth = filing.month;
              pendingYear = filing.year;
            }
          } else {
            // For monthly filing, count every overdue month
            pendingCount += 1;
            pendingMonth = filing.month;
            pendingYear = filing.year;
          }
        }
      }

      // Count all unfiled returns as defaults
      defaultCount = resItem.returnfiling.filter(
        (rf) => rf.filing_status === false,
      ).length;

      // Count defaults in last 12 entries
      lastYearDefaults = resItem.returnfiling
        .filter((rf) => rf.filing_status === false)
        .slice(-12).length;

      resMap.set(resItem.dvat04.id, {
        dvat04: resItem.dvat04,
        returnfiling: [],
        pendingCount: pendingCount,
        defaultCount: defaultCount,
        lastYearDefaults: lastYearDefaults,
        lastfiling: lastfiling,
        hasSale: false,
        hasPurchase: false,
        pendingMonth: pendingMonth,
        pendingYear: pendingYear,
        isQuarterly: isQuarterly,
      });
    }

    // // Convert Map to array and filter dealers with 3+ defaults in the past year
    const res: ResponseType[] = Array.from(resMap.values())
      .filter((val: ResponseType) => val.lastYearDefaults >= 3)
      .sort((a, b) => b.pendingCount - a.pendingCount);

    // Check for sales and purchases in pending period
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

    const getMonthsInSameQuarter = (month: string): string[] => {
      for (const [quarter, months] of Object.entries(quarterMonthsMap)) {
        if (months.includes(month)) {
          return months;
        }
      }
      return [month];
    };

    for (const response of res) {
      if (response.pendingMonth && response.pendingYear) {
        const year = parseInt(response.pendingYear);
        const monthsToCheck = response.isQuarterly
          ? getMonthsInSameQuarter(response.pendingMonth)
          : [response.pendingMonth];
   
        // Build date ranges for all months to check
        const dateRanges: Array<{ start: Date; end: Date }> = [];
        for (const month of monthsToCheck) {
          const monthIndex = monthNames.indexOf(month);
          if (monthIndex >= 0) {
            dateRanges.push({
              start: new Date(year, monthIndex, 1),
              end: new Date(year, monthIndex + 1, 0, 23, 59, 59),
            });
          }
        }

        // Check for sales in daily_sale table
        let hasSale = false;
        for (const range of dateRanges) {
          const start_date = new Date(2026, 3, 1); // April 1, 2026 (month is 0-indexed)
          const end_date = new Date(2026, 6, 31, 23, 59, 59); // July 31, 2026 (month is 0-indexed)
          const saleCount = await prisma.daily_sale.count({
            where: {
              dvat04Id: response.dvat04.id,
              invoice_date: {
                gte: start_date,
                lte: end_date,
              },
              deletedAt: null,
            },
          });
          if (saleCount > 0) {
            hasSale = true;
            break;
          }
        }
        response.hasSale = hasSale;

        // Check for purchases in daily_purchase table
        let hasPurchase = false;
        for (const range of dateRanges) {
          const start_date = new Date(2026, 3, 1); // April 1, 2026 (month is 0-indexed)
          const end_date = new Date(2026, 6, 31, 23, 59, 59); // July 31, 2026 (month is 0-indexed)

          const purchaseCount = await prisma.daily_purchase.count({
            where: {
              dvat04Id: response.dvat04.id,
              invoice_date: {
                gte: start_date,
                lte: end_date,
              },
              deletedAt: null,
            },
          });
          if (purchaseCount > 0) {
            hasPurchase = true;
            break;
          }
        }
        response.hasPurchase = hasPurchase;
      }
    }

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
