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
  late: number;
  filed: number;
  pending: number;
  due: number;
}

interface TimeLineSummaryPayload {
  arnnumber?: string;
  tradename?: string;
  dept: SelectOffice;
  skip: number;
  take: number;
  year?: number;
  sortField?: "filed" | "late" | "pending";
  sortOrder?: "asc" | "desc";
}

const TimeLineSummary = async (
  payload: TimeLineSummaryPayload
): Promise<PaginationResponse<Array<ResponseType> | null>> => {
  const functionname: string = TimeLineSummary.name;
  try {
    const dvat04response = await prisma.return_filing.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
        ...(payload.year && { year: payload.year.toString() }),
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

    for (let i = 0; i < dvat04response.length; i++) {
      const currentDvat: dvat04 = dvat04response[i].dvat;

      const return_status = dvat04response[i].return_status;

      if (currentDvat) {
        if (resMap.has(currentDvat.id)) {
          let existingData: ResponseType = resMap.get(
            currentDvat.id
          ) as ResponseType;

          existingData.due += return_status == "DUE" ? 1 : 0;
          existingData.filed += return_status == "FILED" ? 1 : 0;
          existingData.pending += return_status == "PENDINGFILING" ? 1 : 0;
          existingData.late += return_status == "LATEFILED" ? 1 : 0;
        } else {
          resMap.set(currentDvat.id, {
            dvat04: currentDvat,
            due: return_status == "DUE" ? 1 : 0,
            filed: return_status == "FILED" ? 1 : 0,
            pending: return_status == "PENDINGFILING" ? 1 : 0,
            late: return_status == "LATEFILED" ? 1 : 0,
          });
        }
      }
    }

    interface NoticeType {
      dvat04id: number;
      notice_count: number;
    }

    // Convert Map to an array
    const res: ResponseType[] = Array.from(resMap.values());

    // Apply sorting if specified
    if (payload.sortField && payload.sortOrder) {
      res.sort((a, b) => {
        const aValue = a[payload.sortField!];
        const bValue = b[payload.sortField!];
        
        if (payload.sortOrder === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }

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

export default TimeLineSummary;
