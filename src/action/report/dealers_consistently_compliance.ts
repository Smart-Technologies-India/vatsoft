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

interface DealersConsistentlyCompliantPayload {
  arnnumber?: string;
  tradename?: string;
  dept: SelectOffice;
  skip: number;
  take: number;
}

const DealersConsistentlyCompliant = async (
  payload: DealersConsistentlyCompliantPayload
): Promise<PaginationResponse<Array<ResponseType> | null>> => {
  const functionname: string = DealersConsistentlyCompliant.name;
  try {
    const today = new Date();

    const months = [
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

    const monthsArray: string[] = [];
    const yearsSet = new Set<string>(); // to avoid duplicate years

    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthsArray.push(months[date.getMonth()]);
      yearsSet.add(date.getFullYear().toString());
    }

    // Optional: reverse months to go from oldest to latest
    monthsArray.reverse();

    const yearsArray: string[] = Array.from(yearsSet).sort();

    const dvat04response = await prisma.return_filing.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        month: {
          in: monthsArray,
        },
        year: {
          in: yearsArray,
        },
        dvat: {
          ...(payload.arnnumber && { tinNumber: payload.arnnumber }),
          ...(payload.tradename && {
            OR: [
              { tradename: { contains: payload.tradename } },
              { name: { contains: payload.tradename } },
            ],
          }),
          selectOffice: payload.dept,
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

      const return_status = dvat04response[i].return_status;

      // const isLate = IsFilingLate(filingDate, due_date);

      if (currentDvat) {
        if (resMap.has(currentDvat.id)) {
          let existingData: ResponseType = resMap.get(
            currentDvat.id
          ) as ResponseType;

          if (
            return_status == "LATEFILED" ||
            return_status == "PENDINGFILING"
          ) {
            existingData.isLate = true;
          }

          if (return_status == "FILED") {
            existingData.lastfiling = currentLastFiling;
            existingData.pending += 1; // Increase pending count if filing_status is true
          }
        } else {
          resMap.set(currentDvat.id, {
            dvat04: currentDvat,
            lastfiling: filingStatus ? currentLastFiling : "N/A",
            pending: return_status == "FILED" ? 1 : 0,
            notice: 0,
            isLate:
              return_status == "DUE" || return_status == "FILED" ? false : true,
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
      (val: ResponseType) => val.isLate == false
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

export default DealersConsistentlyCompliant;

const IsFilingLate = (
  filingDateStr: Date | null,
  due_date: Date | null
): boolean => {
  if (!filingDateStr || !due_date) {
    return false; // Invalid input
  }

  if (filingDateStr != null) {
    const [day, month, year] = filingDateStr.toString().split("/").map(Number);
    const filingDate = new Date(year, month - 1, day);

    return filingDate > due_date;
  } else {
    return true;
  }
};
