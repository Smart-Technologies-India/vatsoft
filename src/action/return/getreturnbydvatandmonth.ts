"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  dvat04,
  registration,
  returns_01,
  returns_entry,
  tin_number_master,
  user,
} from "@prisma/client";

interface GetReturnByDvatAndMonthPayload {
  dvat04Id: number;
  month: string;
  year: string;
}

const GetReturnByDvatAndMonth = async (
  payload: GetReturnByDvatAndMonthPayload,
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
    // Fetch the return for the specified DVAT, month, and year
    const return01response = await prisma.returns_01.findFirst({
      where: {
        dvat04Id: payload.dvat04Id,
        month: payload.month,
        year: payload.year,
        deletedAt: null,
        deletedById: null,
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
        message: "Return not found for the specified period.",
        functionname: "GetReturnByDvatAndMonth",
      };
    }

    const returnsEntryResponse = await prisma.returns_entry.findMany({
      where: {
        returns_01Id: return01response.id,
        deletedAt: null,
        deletedById: null,
      },
      include: {
        seller_tin_number: true,
      },
    });

    return {
      status: true,
      data: {
        returns_entry: returnsEntryResponse,
        returns_01: return01response,
      },
      message: "Return fetched successfully.",
      functionname: "GetReturnByDvatAndMonth",
    };
  } catch (error) {
    console.error("Error in GetReturnByDvatAndMonth:", error);
    return {
      status: false,
      data: null,
      message: errorToString(error),
      functionname: "GetReturnByDvatAndMonth",
    };
  }
};

export default GetReturnByDvatAndMonth;
