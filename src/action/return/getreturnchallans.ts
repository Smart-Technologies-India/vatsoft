"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import { challan, returns_01, dvat04 } from "@prisma/client";

interface GetReturnChallansPayload {
  returnId: number;
}

const GetReturnChallans = async (
  payload: GetReturnChallansPayload,
): Promise<
  ApiResponseType<Array<
    challan & {
      returns_01: (returns_01 & { dvat04: dvat04 }) | null;
    }
  > | null>
> => {
  const functionname: string = GetReturnChallans.name;
  try {
    if (!payload.returnId) {
      return {
        status: false,
        data: null,
        message: "Invalid return id. Please try again.",
        functionname,
      };
    }

    // First, fetch the return to check if it's quarterly filing
    const return01 = await prisma.returns_01.findFirst({
      where: {
        id: payload.returnId,
        deletedAt: null,
        deletedById: null,
      },
      include: {
        dvat04: true,
      },
    });

    if (!return01) {
      return {
        status: false,
        data: null,
        message: "Return not found.",
        functionname,
      };
    }

    // Check if this is quarterly filing
    const isQuarterlyFiling =
      return01.dvat04.frequencyFilings?.toUpperCase() === "QUARTERLY";

    let returnIds: number[] = [payload.returnId];

    if (isQuarterlyFiling) {
      // For quarterly filings, get all returns for the three months in the quarter
      const quarterLastMonthMap: { [key: string]: string } = {
        January: "March",
        February: "March",
        March: "March",
        April: "June",
        May: "June",
        June: "June",
        July: "September",
        August: "September",
        September: "September",
        October: "December",
        November: "December",
        December: "December",
      };

      const lastMonthOfQuarter = quarterLastMonthMap[return01.month!];

      const quarterMonthsMap: { [key: string]: string[] } = {
        March: ["January", "February", "March"],
        June: ["April", "May", "June"],
        September: ["July", "August", "September"],
        December: ["October", "November", "December"],
      };

      const quarterMonths = quarterMonthsMap[lastMonthOfQuarter] || [];

      // Fetch all returns for the quarter
      const quarterReturns = await prisma.returns_01.findMany({
        where: {
          dvat04Id: return01.dvat04Id,
          year: return01.year,
          month: {
            in: quarterMonths,
          },
          return_type: return01.return_type,
          deletedAt: null,
          deletedById: null,
        },
      });

      returnIds = quarterReturns.map((r) => r.id);
    }

    // Get all challans for the return(s)
    const challans = await prisma.challan.findMany({
      where: {
        returnid: {
          in: returnIds,
        },
        deletedAt: null,
        deletedById: null,
        paymentstatus: "PAID",
      },
      include: {
        returns_01: {
          include: {
            dvat04: true,
          },
        },
      },
      orderBy: {
        transaction_date: "desc",
      },
    });

    if (!challans || challans.length === 0) {
      return {
        status: true,
        data: [],
        message: "No challans found for this return.",
        functionname,
      };
    }

    return {
      status: true,
      data: challans,
      message: "Return challans retrieved successfully.",
      functionname,
    };
  } catch (e) {
    const response: ApiResponseType<null> = {
      status: false,
      data: null,
      message: errorToString(e),
      functionname,
    };
    return response;
  }
};

export default GetReturnChallans;
