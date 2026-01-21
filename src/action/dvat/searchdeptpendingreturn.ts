"use server";

import { errorToString } from "@/utils/methods";
import { dvat04, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

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
  payload: DeptPendingReturnPayload
): Promise<PaginationResponse<Array<ResponseType> | null>> => {
  const functionname: string = SearchDeptPendingReturn.name;
  try {
    const dvat04response = await prisma.return_filing.findMany({
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
        },
      },

      include: {
        dvat: {},
      },
      orderBy: {
        createdAt: "asc",
      },
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

    if (!dvat04response)
      return createPaginationResponse({
        message: "There is no returns data",
        functionname,
      });

    let resMap = new Map<number, ResponseType>(); // Track dvat04 by ID
    const currentDate = new Date();

    for (let i = 0; i < dvat04response.length; i++) {
      const currentDvat = dvat04response[i].dvat;
      const filingStatus = dvat04response[i].filing_status;
      const currentLastFiling = `${dvat04response[i].month}-${dvat04response[i].year}`;
      const dueDate = dvat04response[i].due_date
        ? new Date(dvat04response[i].due_date!)
        : null;

      if (currentDvat) {
        if (resMap.has(currentDvat.id)) {
          // If dvat already exists
          let existingData = resMap.get(currentDvat.id);

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

    const res = Array.from(resMap.values()).filter(
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

export default SearchDeptPendingReturn;
