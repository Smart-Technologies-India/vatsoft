"use server";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  dvat04,
  returns_01,
  returns_entry,
  tin_number_master,
  commodity_master,
  state,
} from "@prisma/client";

interface GetReturnsEntriesByMonthPayload {
  dvatid: number;
  month: string;
  year: string;
}

type ReturnsEntryWithRelations = returns_entry & {
  seller_tin_number: tin_number_master;
  commodity_master: commodity_master | null;
  state: state | null;
};

const getReturnsEntriesByMonth = async (
  payload: GetReturnsEntriesByMonthPayload,
): Promise<
  ApiResponseType<{
    dvat04: dvat04;
    returns_01: returns_01;
    returns_entry: ReturnsEntryWithRelations[];
  } | null>
> => {
  const functionname: string = getReturnsEntriesByMonth.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId) {
      return createResponse({
        message: "Not authenticated. Please login.",
        functionname,
      });
    }

    if (!currentDvatId) {
      return createResponse({
        message: "DVAT ID not found. Please try again.",
        functionname,
      });
    }

    // Fetch returns_01 record for the given month and year
    const returns01 = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        month: payload.month,
        year: payload.year,
        dvat04Id: payload.dvatid,
      },
    });

    if (!returns01) {
      return createResponse({
        message: "No return filing found for the selected month.",
        functionname,
      });
    }

    // Fetch dvat04 data
    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        id: payload.dvatid,
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!dvat04) {
      return createResponse({
        message: "DVAT registration data not found.",
        functionname,
      });
    }

    // Fetch all returns_entry records for this return filing
    const entries = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        returns_01Id: returns01.id,
      },
      include: {
        seller_tin_number: true,
        commodity_master: true,
        state: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return createResponse({
      message: "Returns entries fetched successfully",
      functionname,
      data: {
        dvat04,
        returns_01: returns01,
        returns_entry: entries,
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default getReturnsEntriesByMonth;
