"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04, returns_01 } from "@prisma/client";
import prisma from "../../../prisma/database";

interface SearchReturnPaymentPayload {
  userid?: number;
  rr_number?: string;
  fromdate?: Date;
  todate?: Date;
  tin?: string;
  trade?: string;
}

const SearchReturnPayment = async (
  payload: SearchReturnPaymentPayload
): Promise<ApiResponseType<Array<returns_01 & { dvat04: dvat04 }> | null>> => {
  const functionname: string = SearchReturnPayment.name;

  try {
    const return_01 = await prisma.returns_01.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        NOT: [{ transaction_id: null, track_id: null }],
        ...(payload.userid && { createdById: payload.userid }),
        ...(payload.rr_number && { rr_number: payload.rr_number }),
        ...(payload.fromdate &&
          payload.todate && {
            transaction_date: {
              gte: payload.fromdate,
              lte: payload.todate,
            },
          }),
        ...(payload.tin || payload.trade
          ? {
              dvat04: {
                ...(payload.tin && { tinNumber: payload.tin }),
                ...(payload.trade && {
                  tradename: {
                    contains: payload.trade,
                  },
                }),
              },
            }
          : {}),
      },
      include: {
        dvat04: true,
      },
    });

    return createResponse({
      message: return_01
        ? "Return search Get successfully"
        : "Unable to search return.",
      functionname: functionname,
      data: return_01 ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SearchReturnPayment;
