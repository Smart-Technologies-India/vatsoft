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
  lastfiling: string;
  pending: number;
  notice: number;
  hasSale: boolean;
  hasPurchase: boolean;
  pendingMonth?: string;
  pendingYear?: string;
  isQuarterly?: boolean;
}

interface GetInactiveDealersPayload {
  arnnumber?: string;
  tradename?: string;
  commodity?: string;
  frequency?: string;
  dealerType?: string;
  dept?: SelectOffice;
  skip: number;
  take: number;
}

const GetInactiveDealers = async (
  payload: GetInactiveDealersPayload
): Promise<PaginationResponse<Array<ResponseType> | null>> => {
  const functionname: string = GetInactiveDealers.name;
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "GetInactiveDealers",
      } as any;
    }

    const dvat04response = await prisma.return_filing.findMany({
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
          ...(payload.dept && { selectOffice: payload.dept }),
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

    // Filter by commodity and frequency after fetching (since they are enum fields)
    let filteredResponse = dvat04response;
    if (payload.commodity) {
      filteredResponse = filteredResponse.filter(
        (item: any) => item.dvat?.commodity === payload.commodity,
      );
    }
    if (payload.frequency) {
      filteredResponse = filteredResponse.filter(
        (item: any) => item.dvat?.frequencyFilings === payload.frequency,
      );
    }

    const notice = await prisma.order_notice.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "PENDING",
        notice_order_type: "NOTICE",
        form_type: "DVAT10",
      },
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

    for (let i = 0; i < filteredResponse.length; i++) {
      const currentDvat: dvat04 = filteredResponse[i].dvat;
      const filingStatus: boolean = filteredResponse[i].filing_status;
      const currentLastFiling: string = `${filteredResponse[i].month}-${filteredResponse[i].year}`;
      const dueDate: Date | null = filteredResponse[i].due_date
        ? new Date(filteredResponse[i].due_date!)
        : null;
      const isQuarterly = currentDvat.frequencyFilings === "QUARTERLY";

      if (currentDvat) {
        if (resMap.has(currentDvat.id)) {
          // If dvat already exists
          let existingData: ResponseType = resMap.get(
            currentDvat.id
          ) as ResponseType;

          if (existingData) {
            if (!filingStatus && dueDate && dueDate < currentDate) {
              // Increase pending count if filing_status is false
              // For quarterly filing, only count if it's the last month of the quarter
              if (isQuarterly) {
                const lastMonthOfQuarter = getLastMonthOfQuarter(filteredResponse[i].month);
                if (filteredResponse[i].month === lastMonthOfQuarter) {
                  existingData.pending += 1;
                  existingData.pendingMonth = filteredResponse[i].month;
                  existingData.pendingYear = filteredResponse[i].year;
                }
              } else {
                // For monthly filing, count every overdue month
                existingData.pending += 1;
                existingData.pendingMonth = filteredResponse[i].month;
                existingData.pendingYear = filteredResponse[i].year;
              }
            } else if (filingStatus) {
              // Update lastfiling if filing_status is true and lastfiling is newer
              existingData.lastfiling = currentLastFiling;
            }
          }
        } else {
          // If dvat does not exist, create a new entry
          let pendingCount = 0;
          let pendingMonth = "";
          let pendingYear = "";
          if (!filingStatus && dueDate && dueDate < currentDate) {
            // For quarterly filing, only count if it's the last month of the quarter
            if (isQuarterly) {
              const lastMonthOfQuarter = getLastMonthOfQuarter(filteredResponse[i].month);
              if (filteredResponse[i].month === lastMonthOfQuarter) {
                pendingCount = 1;
                pendingMonth = filteredResponse[i].month;
                pendingYear = filteredResponse[i].year;
              }
            } else {
              // For monthly filing, count every overdue month
              pendingCount = 1;
              pendingMonth = filteredResponse[i].month;
              pendingYear = filteredResponse[i].year;
            }
          }
          resMap.set(currentDvat.id, {
            dvat04: currentDvat,
            lastfiling: filingStatus ? currentLastFiling : "N/A",
            pending: pendingCount,
            notice: 0,
            hasSale: false,
            hasPurchase: false,
            pendingMonth: pendingMonth,
            pendingYear: pendingYear,
            isQuarterly: isQuarterly,
          });
        }
      }
    }

    interface NoticeType {
      dvat04id: number;
      notice_count: number;
    }

    let noticeMap = new Map<number, NoticeType>(); // Track dvat04 by ID

    for (let i = 0; i < notice.length; i++) {
      if (noticeMap.has(notice[i].dvatid)) {
        let existingData: NoticeType = noticeMap.get(
          notice[i].dvatid
        ) as NoticeType;
        existingData.notice_count += 1;
      } else {
        noticeMap.set(notice[i].dvatid, {
          dvat04id: notice[i].dvatid,
          notice_count: 1,
        });
      }
    }

    const notice_count = Array.from(noticeMap.values());

    // Convert Map to an array
    const res: ResponseType[] = Array.from(resMap.values()).filter(
      (val: ResponseType) => val.pending != 0 && val.pending > 3
    );

    res.forEach((response) => {
      const matchingNotice = notice_count.find(
        (notice) => notice.dvat04id === response.dvat04.id
      );

      if (matchingNotice) {
        response.notice = matchingNotice.notice_count;
      }
    });

    // Check for sales and purchases in pending period
    for (const response of res) {
      if (response.pendingMonth && response.pendingYear) {
        // Convert month name to month number (0-11)
        const monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        
        // Quarter to months mapping
        const quarterMonthsMap: Record<string, string[]> = {
          QUARTER1: ["April", "May", "June"],
          QUARTER2: ["July", "August", "September"],
          QUARTER3: ["October", "November", "December"],
          QUARTER4: ["January", "February", "March"],
        };

        // Get all months in the same quarter
        const getMonthsInSameQuarter = (month: string): string[] => {
          for (const [quarter, months] of Object.entries(quarterMonthsMap)) {
            if (months.includes(month)) {
              return months;
            }
          }
          return [month];
        };
        
        const year = parseInt(response.pendingYear);
        const monthsToCheck = response.isQuarterly 
          ? getMonthsInSameQuarter(response.pendingMonth)
          : [response.pendingMonth];

        // Build date ranges for all months to check
        const dateRanges: Array<{start: Date, end: Date}> = [];
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
          const saleCount = await prisma.daily_sale.count({
            where: {
              dvat04Id: response.dvat04.id,
              createdAt: {
                gte: range.start,
                lte: range.end,
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
          const purchaseCount = await prisma.daily_purchase.count({
            where: {
              dvat04Id: response.dvat04.id,
              createdAt: {
                gte: range.start,
                lte: range.end,
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
      message: "Pending returns data get successfully",
      functionname,
      data: paginatedData,
      allData: res,
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

export default GetInactiveDealers;
