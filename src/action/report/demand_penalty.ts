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
  penalty: number;
  penalty_count: number;
  interest: number;
  interest_count: number;
}

interface DemandPenaltyPayload {
  arnnumber?: string;
  tradename?: string;
  dept: SelectOffice;
  skip: number;
  take: number;
}

const DemandPenalty = async (
  payload: DemandPenaltyPayload
): Promise<PaginationResponse<Array<ResponseType> | null>> => {
  const functionname: string = DemandPenalty.name;
  try {
    const dvat04response = await prisma.challan.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        reason: "DEMAND",
        OR: [
          {
            challanstatus: "CREATED",
          },
          {
            challanstatus: "DUE",
          },
        ],
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

    let resMap = new Map<number, ResponseType>(); // Track dvat04 by ID
    // const currentDate = new Date();

    for (let i = 0; i < dvat04response.length; i++) {
      const currentDvat: dvat04 = dvat04response[i].dvat;

      const interest: number = parseInt(dvat04response[i].interest ?? "0");
      const penalty: number = parseInt(dvat04response[i].penalty ?? "0");

      if (interest > 0 || penalty > 0) {
        if (resMap.has(currentDvat.id)) {
          let existingData: ResponseType = resMap.get(
            currentDvat.id
          ) as ResponseType;

          if (interest > 0) {
            existingData.interest += interest;
            existingData.interest_count += 1;
          }
          if (penalty > 0) {
            existingData.penalty += penalty;
            existingData.penalty_count += 1;
          }
        } else {
          resMap.set(currentDvat.id, {
            dvat04: currentDvat,
            penalty: penalty > 0 ? penalty : 0,
            penalty_count: penalty > 0 ? 1 : 0,
            interest: interest > 0 ? interest : 0,
            interest_count: interest > 0 ? 1 : 0,
          });
        }
      }
    }

    // interface NoticeType {
    //   dvat04id: number;
    //   notice_count: number;
    // }

    // let noticeMap = new Map<number, NoticeType>(); // Track dvat04 by ID

    // for (let i = 0; i < notice.length; i++) {
    //   if (noticeMap.has(notice[i].dvatid)) {
    //     let existingData: NoticeType = noticeMap.get(
    //       notice[i].dvatid
    //     ) as NoticeType;
    //     existingData.notice_count += 1;
    //   } else {
    //     noticeMap.set(notice[i].dvatid, {
    //       dvat04id: notice[i].dvatid,
    //       notice_count: 1,
    //     });
    //   }
    // }

    // const notice_count = Array.from(noticeMap.values());

    // Convert Map to an array
    const res: ResponseType[] = Array.from(resMap.values());

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

export default DemandPenalty;
