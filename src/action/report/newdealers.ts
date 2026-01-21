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
}

interface GetNewDealersPayload {
  dept: SelectOffice;
  skip: number;
  take: number;
}

const GetNewDealers = async (
  payload: GetNewDealersPayload
): Promise<PaginationResponse<Array<ResponseType> | null>> => {
  const functionname: string = GetNewDealers.name;

  const currentDate = new Date();
  // curretn date - 6 months
  const sixMonthsAgo = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 6,
    currentDate.getDate()
  );

  try {
    const dvat04response = await prisma.return_filing.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        dvat: {
          selectOffice: payload.dept,
          deletedAt: null,
          deletedBy: null,
          createdAt: {
            gte: sixMonthsAgo,
            lte: currentDate,
          },
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
    // const currentDate = new Date();

    for (let i = 0; i < dvat04response.length; i++) {
      const currentDvat: dvat04 = dvat04response[i].dvat;
      const filingStatus: boolean = dvat04response[i].filing_status;
      const currentLastFiling: string = `${dvat04response[i].month}-${dvat04response[i].year}`;
      const dueDate: Date | null = dvat04response[i].due_date
        ? new Date(dvat04response[i].due_date!)
        : null;

      if (currentDvat) {
        if (resMap.has(currentDvat.id)) {
          // If dvat already exists
          let existingData: ResponseType = resMap.get(
            currentDvat.id
          ) as ResponseType;

          if (existingData) {
            if (!filingStatus && dueDate && dueDate < currentDate) {
              // Increase pending count if filing_status is false

              existingData.pending += 1;
            } else if (filingStatus) {
              // Update lastfiling if filing_status is true and lastfiling is newer
              existingData.lastfiling = currentLastFiling;
            }
          }
        } else {
          // If dvat does not exist, create a new entry
          resMap.set(currentDvat.id, {
            dvat04: currentDvat,
            lastfiling: filingStatus ? currentLastFiling : "N/A",
            pending: !filingStatus && dueDate && dueDate < currentDate ? 1 : 0,
            notice: 0,
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

export default GetNewDealers;
