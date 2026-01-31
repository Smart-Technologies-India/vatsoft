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
  pending: number;
  notice: number;
  isLate: boolean;
}

interface AfterDeathLinePayload {
  arnnumber?: string;
  tradename?: string;
  dept?: SelectOffice;
  skip: number;
  take: number;
}

const AfterDeathLine = async (
  payload: AfterDeathLinePayload
): Promise<PaginationResponse<Array<ResponseType> | null>> => {
  const functionname: string = AfterDeathLine.name;
  try {
    const dvat04response = await prisma.return_filing.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        dvat: {
          ...(payload.arnnumber && { tinNumber: payload.arnnumber }),
          ...(payload.tradename && {
            OR: [
              { tradename: { contains: payload.tradename } },
              { name: { contains: payload.tradename } },
            ],
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

    const notice = await prisma.order_notice.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        status: "PENDING",
        notice_order_type: "NOTICE",
        form_type: "DVAT10",
      },
    });

    let resMap = new Map<number, ResponseType>(); // Track dvat04 by ID
    const currentDate = new Date();

    for (let i = 0; i < dvat04response.length; i++) {
      const currentDvat: dvat04 = dvat04response[i].dvat;
      const filingStatus: boolean = dvat04response[i].filing_status;
      const currentLastFiling: string = `${dvat04response[i].month}-${dvat04response[i].year}`;
      const dueDate: Date | null = dvat04response[i].due_date
        ? new Date(dvat04response[i].due_date!)
        : null;

      const filingDate = dvat04response[i].filing_date;
      const filingMonth = dvat04response[i].month;
      const filingYear = dvat04response[i].year;

      const isLate = IsFilingLate(
        filingDate,
        filingMonth,
        parseInt(filingYear)
      );

      if (currentDvat) {
        if (resMap.has(currentDvat.id)) {
          // If dvat already exists
          let existingData: ResponseType = resMap.get(
            currentDvat.id
          ) as ResponseType;

          if (existingData) {
            if (!filingStatus && dueDate && dueDate < currentDate) {
              // Increase pending count if filing_status is false
              // existingData.pending += 1;
            } else if (filingStatus) {
              // Update lastfiling if filing_status is true and lastfiling is newer
              existingData.lastfiling = currentLastFiling;

              if (
                !(dvat04response[i].due_date! > dvat04response[i].filing_date!)
              ) {
                existingData.pending += 1;
              }
            }
            existingData.isLate = isLate;
          }
        } else {
          // If dvat does not exist, create a new entry
          resMap.set(currentDvat.id, {
            dvat04: currentDvat,
            lastfiling: filingStatus ? currentLastFiling : "N/A",
            pending:
              filingStatus &&
              !(dvat04response[i].due_date! > dvat04response[i].filing_date!)
                ? 1
                : 0,
            notice: 0,
            isLate: isLate,
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
      (val: ResponseType) => val.pending != 0
    );

    res.forEach((response) => {
      const matchingNotice = notice_count.find(
        (notice) => notice.dvat04id === response.dvat04.id
      );

      if (matchingNotice) {
        response.notice = matchingNotice.notice_count;
      }
    });

    const paginatedData = res.slice(payload.skip, payload.skip + payload.take);

    return createPaginationResponse({
      message: "Pending returns data get successfully",
      functionname,
      data: paginatedData,
      allData: res, // Return all data for statistics calculation
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

export default AfterDeathLine;

const IsFilingLate = (
  filingDateStr: Date | null,
  filingMonthStr: string,
  filingYear: number
): boolean => {
  if (!filingDateStr || !filingMonthStr || !filingYear) {
    return false; // Invalid input
  }
  // 1. Convert filingMonth string to month index (0-11)
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
  const filingMonthIndex = monthNames.indexOf(filingMonthStr); // December = 11

  // 2. Calculate due date: 28th of next month
  let dueYear = filingYear;
  let dueMonth = filingMonthIndex + 1; // next month
  if (dueMonth > 11) {
    dueMonth = 0;
    dueYear += 1;
  }
  const dueDate = new Date(dueYear, dueMonth, 28); // 28th of next month

  // 3. Parse filing date from "DD/MM/YYYY"
  const [day, month, year] = filingDateStr.toString().split("/").map(Number);
  const filingDate = new Date(year, month - 1, day);

  // 4. Compare
  return filingDate > dueDate;
};
