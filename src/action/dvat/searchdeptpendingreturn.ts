"use server";

import { errorToString } from "@/utils/methods";
import { dvat04, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface DeptPendingReturnPayload {
  fromdate?: Date;
  todate?: Date;
  arnnumber?: string;
  tradename?: string;
  dept?: SelectOffice;
  skip: number;
  take: number;
}

interface ResponseType {
  dvat04: dvat04;
  lastfiling: string;
  pending: number;
  notice: number;
}

const SearchDeptPendingReturn = async (
  payload: DeptPendingReturnPayload,
): Promise<PaginationResponse<Array<ResponseType> | null>> => {
  const functionname: string = SearchDeptPendingReturn.name;
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "SearchDeptPendingReturn",
      } as any;
    }

    const dvat04response = await prisma.return_filing.findMany({
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

    if (!dvat04response)
      return createPaginationResponse({
        message: "There is no returns data",
        functionname,
      });

    let resMap = new Map<number, ResponseType>(); // Track dvat04 by ID
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

    for (let i = 0; i < dvat04response.length; i++) {
      const currentDvat = dvat04response[i].dvat;
      const filingStatus = dvat04response[i].filing_status;
      const currentLastFiling = `${dvat04response[i].month}-${dvat04response[i].year}`;
      const dueDate = dvat04response[i].due_date
        ? new Date(dvat04response[i].due_date!)
        : null;
      const isQuarterly = currentDvat?.frequencyFilings === "QUARTERLY";
      const month = dvat04response[i].month;

      if (currentDvat) {
        if (resMap.has(currentDvat.id)) {
          // If dvat already exists
          let existingData = resMap.get(currentDvat.id);

          if (existingData) {
            if (!filingStatus && dueDate && dueDate < currentDate) {
              // For quarterly filing, only count if it's the last month of the quarter
              if (isQuarterly) {
                const lastMonthOfQuarter = getLastMonthOfQuarter(month);
                if (month === lastMonthOfQuarter) {
                  existingData.pending += 1;
                }
              } else {
                // For monthly filing, count every overdue month
                existingData.pending += 1;
              }
            } else if (filingStatus) {
              // Update lastfiling if filing_status is true and lastfiling is newer
              existingData.lastfiling = currentLastFiling;
            }
          }
        } else {
          // If dvat does not exist, create a new entry
          let pendingCount = 0;
          if (!filingStatus && dueDate && dueDate < currentDate) {
            // For quarterly filing, only count if it's the last month of the quarter
            if (isQuarterly) {
              const lastMonthOfQuarter = getLastMonthOfQuarter(month);
              if (month === lastMonthOfQuarter) {
                pendingCount = 1;
              }
            } else {
              // For monthly filing, count every overdue month
              pendingCount = 1;
            }
          }

          resMap.set(currentDvat.id, {
            dvat04: currentDvat,
            lastfiling: filingStatus ? currentLastFiling : "N/A",
            pending: pendingCount,
            notice: 0,
          });
        }
      }
    }

    const res = Array.from(resMap.values());

    const paginatedData = res
      .sort((a, b) => b.pending - a.pending)
      .slice(payload.skip, payload.skip + payload.take);

    return createPaginationResponse({
      message: "Pending returns data get successfully",
      functionname,
      data: paginatedData,
      skip: payload.skip,
      take: payload.take,
      total: res.length ?? 0,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SearchDeptPendingReturn;
