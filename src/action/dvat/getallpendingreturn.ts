"use server";

import { errorToString } from "@/utils/methods";
import { dvat04, FrequencyFilings, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

interface ResponseType {
  dvat04: dvat04;
  lastfiling: string;
  pending: number;
  notice: number;
}

interface GetAllPendingReturnPayload {
  dept?: SelectOffice;
  arnnumber?: string;
  tradename?: string;
  frequencyFilings?: string;
  compositionScheme?: boolean;
  fromdate?: Date;
  todate?: Date;
}

const GetAllPendingReturn = async (
  payload: GetAllPendingReturnPayload,
): Promise<{
  status: boolean;
  data?: Array<ResponseType>;
  message: string;
}> => {
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        message: "Not authenticated. Please login.",
      };
    }

    // Build return_filing where clause with date filters if provided
    let returnFilingWhere: any = {
      deletedAt: null,
      deletedBy: null,
    };

    if (payload.fromdate || payload.todate) {
      returnFilingWhere.due_date = {};
      if (payload.fromdate) {
        returnFilingWhere.due_date.gte = payload.fromdate;
      }
      if (payload.todate) {
        returnFilingWhere.due_date.lte = payload.todate;
      }
    }

    const dvatRecords = await prisma.dvat04.findMany({
      where: {
        ...(payload.dept && {
          selectOffice: payload.dept ?? SelectOffice.Dadra_Nagar_Haveli,
        }),
        ...(payload.arnnumber && { tinNumber: payload.arnnumber }),
        ...(payload.frequencyFilings && {
          frequencyFilings: payload.frequencyFilings as FrequencyFilings,
        }),
        ...(payload.compositionScheme !== undefined && {
          compositionScheme: payload.compositionScheme,
        }),
        ...(payload.tradename && {
          OR: [
            { tradename: { contains: payload.tradename } },
            { name: { contains: payload.tradename } },
          ],
        }),
        deletedAt: null,
        deletedBy: null,
      },
      include: {
        return_filing: {
          where: returnFilingWhere,
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!dvatRecords || dvatRecords.length === 0) {
      return {
        status: true,
        data: [],
        message: "There is no returns data",
      };
    }

    let resMap = new Map<number, ResponseType>();
    const currentDate = new Date();

    for (let i = 0; i < dvatRecords.length; i++) {
      const currentDvat = dvatRecords[i];
      let lastfiling = "N/A";
      let pending = 0;

      for (let j = 0; j < currentDvat.return_filing.length; j++) {
        const filing = currentDvat.return_filing[j];
        const filingStatus = filing.filing_status;
        const currentLastFiling = `${filing.month}-${filing.year}`;
        const dueDate = filing.due_date ? new Date(filing.due_date) : null;

        if (filingStatus) {
          lastfiling = currentLastFiling;
        } else if (dueDate && dueDate < currentDate) {
          pending += 1;
        }
      }

      resMap.set(currentDvat.id, {
        dvat04: currentDvat,
        lastfiling,
        pending,
        notice: 0,
      });
    }

    // Fetch notice count for the filtered dvat records
    const dvatIds = Array.from(resMap.keys());
    const notice = await prisma.order_notice.findMany({
      where: {
        dvatid: { in: dvatIds },
        deletedAt: null,
        deletedBy: null,
        status: "PENDING",
        notice_order_type: "NOTICE",
      },
    });

    interface NoticeType {
      dvat04id: number;
      notice_count: number;
    }

    let noticeMap = new Map<number, NoticeType>();

    for (let i = 0; i < notice.length; i++) {
      if (noticeMap.has(notice[i].dvatid)) {
        let existingData: NoticeType = noticeMap.get(
          notice[i].dvatid,
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

    // Convert Map to an array and filter out records with pending = 0
    const res: ResponseType[] = Array.from(resMap.values()).filter(
      (val: ResponseType) => val.pending !== 0,
    );

    res.forEach((response) => {
      const matchingNotice = notice_count.find(
        (notice) => notice.dvat04id === response.dvat04.id,
      );

      if (matchingNotice) {
        response.notice = matchingNotice.notice_count;
      }
    });

    const allData = res.sort((a, b) => b.pending - a.pending);

    return {
      status: true,
      data: allData,
      message: "All pending returns data retrieved successfully",
    };
  } catch (error) {
    return {
      status: false,
      message: errorToString(error),
    };
  }
};

export default GetAllPendingReturn;
