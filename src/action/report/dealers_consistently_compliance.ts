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
  payload: DealersConsistentlyCompliantPayload,
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
        due_date: "asc",
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
      const filingStatus: boolean = dvat04response[i].filing_status;
      const currentLastFiling: string = `${dvat04response[i].month}-${dvat04response[i].year}`;

      const return_status = dvat04response[i].return_status;

      if (currentDvat) {
        if (resMap.has(currentDvat.id)) {
          let existingData: ResponseType = resMap.get(
            currentDvat.id,
          ) as ResponseType;

          // Mark as non-compliant if any return is LATEFILED or PENDINGFILING
          if (
            return_status == "LATEFILED" ||
            return_status == "PENDINGFILING"
          ) {
            existingData.isLate = true;
          }

          if (return_status == "FILED" || return_status == "DUE") {
            existingData.lastfiling = currentLastFiling;
            existingData.pending += 1;
          }
        } else {
          resMap.set(currentDvat.id, {
            dvat04: currentDvat,
            lastfiling: filingStatus ? currentLastFiling : "N/A",
            pending: return_status == "FILED" || return_status == "DUE" ? 1 : 0,
            isLate:
              return_status == "LATEFILED" || return_status == "PENDINGFILING",
          });
        }
      }
    }

    // Convert Map to an array and filter only compliant dealers
    // A dealer is compliant if they have filed all 6 returns on time (FILED status)
    // If any return is LATEFILED or PENDINGFILING, they are not compliant
    const res: ResponseType[] = Array.from(resMap.values()).filter(
      (val: ResponseType) => val.isLate == false && val.pending == 6,
    );

    const paginatedData = res.slice(payload.skip, payload.skip + payload.take);

    return createPaginationResponse({
      message: "Compliant dealers data retrieved successfully",
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
  due_date: Date | null,
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
