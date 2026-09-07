"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  dvat04,
  Quarter,
  registration,
  returns_01,
  returns_entry,
  tin_number_master,
  user,
} from "@prisma/client";

interface GetReturnByIdWithQuarterlyPayload {
  returnId: number;
}

const GetReturnByIdWithQuarterly = async (
  payload: GetReturnByIdWithQuarterlyPayload
): Promise<
  ApiResponseType<{
    returns_entry: Array<
      returns_entry & { seller_tin_number: tin_number_master }
    >;
    returns_01: returns_01 & {
      createdBy: user;
      dvat04: dvat04 & { registration: registration[] };
    };
  } | null>
> => {
  try {
    if (!payload.returnId) {
      return {
        status: false,
        data: null,
        message: "Return ID is required.",
        functionname: "GetReturnByIdWithQuarterly",
      };
    }

    // Fetch return by ID
    const return01response = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        id: payload.returnId,
      },
      include: {
        createdBy: true,
        dvat04: {
          include: {
            registration: true,
          },
        },
      },
    });

    if (!return01response) {
      return {
        status: false,
        data: null,
        message: "Return not found. Please try again.",
        functionname: "GetReturnByIdWithQuarterly",
      };
    }

    // Fetch return entries for this return
    let mergedEntries: Array<
      returns_entry & { seller_tin_number: tin_number_master }
    > = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        returns_01Id: return01response.id,
        status: "ACTIVE",
      },
      include: {
        seller_tin_number: true,
        state: true,
      },
    });

    if (!mergedEntries) {
      mergedEntries = [];
    }

    // If quarterly filing, fetch other months in the quarter
    const isQuarterlyFiling = return01response.dvat04?.frequencyFilings === "QUARTERLY";
    
    if (isQuarterlyFiling) {
      const monthToQuarterMap: { [key: string]: Quarter } = {
        January: Quarter.QUARTER4,
        February: Quarter.QUARTER4,
        March: Quarter.QUARTER4,
        April: Quarter.QUARTER1,
        May: Quarter.QUARTER1,
        June: Quarter.QUARTER1,
        July: Quarter.QUARTER2,
        August: Quarter.QUARTER2,
        September: Quarter.QUARTER2,
        October: Quarter.QUARTER3,
        November: Quarter.QUARTER3,
        December: Quarter.QUARTER3,
      };

      const quarterMonthsMap: Record<Quarter, string[]> = {
        QUARTER1: ["April", "May", "June"],
        QUARTER2: ["July", "August", "September"],
        QUARTER3: ["October", "November", "December"],
        QUARTER4: ["January", "February", "March"],
      };

      const effectiveQuarter = monthToQuarterMap[return01response.month || ""];
      const quarterMonths = effectiveQuarter
        ? quarterMonthsMap[effectiveQuarter].filter(
            (quarterMonth) => quarterMonth !== return01response.month,
          )
        : [];

      // Fetch entries for other months in the quarter
      for (const quarterMonth of quarterMonths) {
        const getNewYear = (year: string, month: string): string => {
          if (["January", "February", "March"].includes(month)) {
            return (parseInt(year) + 1).toString();
          }
          return year;
        };

        const quarterYear = getNewYear(return01response.year, quarterMonth);

        const quarterReturn = await prisma.returns_01.findFirst({
          where: {
            dvat04Id: return01response.dvat04Id,
            month: quarterMonth,
            year: quarterYear,
            deletedAt: null,
            deletedById: null,
          },
        });

        if (quarterReturn) {
          const quarterEntries = await prisma.returns_entry.findMany({
            where: {
              returns_01Id: quarterReturn.id,
              status: "ACTIVE",
              deletedAt: null,
              deletedById: null,
            },
            include: {
              seller_tin_number: true,
              state: true,
            },
          });

          if (quarterEntries && quarterEntries.length > 0) {
            mergedEntries.push(...quarterEntries);
          }
        }
      }
    }

    return {
      status: true,
      data: {
        returns_entry: mergedEntries,
        returns_01: return01response,
      },
      message: "Return data with quarterly entries fetched successfully",
      functionname: "GetReturnByIdWithQuarterly",
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: "GetReturnByIdWithQuarterly",
    };
    return response;
  }
};

export default GetReturnByIdWithQuarterly;
