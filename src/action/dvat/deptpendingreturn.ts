"use server";
interface DeptPendingReturnPayload {}

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04 } from "@prisma/client";
import prisma from "../../../prisma/database";

interface ResponseType {
  dvat04: dvat04;
  lastfiling: string;
  pending: number;
}

const DeptPendingReturn = async (
  payload: DeptPendingReturnPayload
): Promise<ApiResponseType<Array<ResponseType> | null>> => {
  const functionname: string = DeptPendingReturn.name;
  try {
    const dvat04response = await prisma.return_filing.findMany({
      where: {
        deletedAt: null,
        deletedBy: null,
      },
      include: {
        dvat: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!dvat04response)
      return createResponse({
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
            lastfiling: currentLastFiling,
            pending: !filingStatus && dueDate && dueDate < currentDate ? 1 : 0,
          });
        }
      }
    }

    // Convert Map to an array
    const res = Array.from(resMap.values());

    return createResponse({
      message: "Pending returns data get successfully",
      functionname,
      data: res,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default DeptPendingReturn;
