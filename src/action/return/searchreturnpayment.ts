"use server";

import { errorToString } from "@/utils/methods";
import { dvat04, returns_01, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";
import {
  createPaginationResponse,
  PaginationResponse,
} from "@/models/response";

interface SearchReturnPaymentPayload {
  userid?: number;
  rr_number?: string;
  fromdate?: Date;
  todate?: Date;
  tin?: string;
  trade?: string;
  dept: SelectOffice;
  skip: number;
  take: number;
}

const SearchReturnPayment = async (
  payload: SearchReturnPaymentPayload
): Promise<
  PaginationResponse<Array<returns_01 & { dvat04: dvat04 }> | null>
> => {
  const functionname: string = SearchReturnPayment.name;

  try {
    const [return_01, totalCount] = await Promise.all([
      prisma.returns_01.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
          dvat04: {
            selectOffice: payload.dept,
            ...(payload.tin && { tinNumber: payload.tin }),
            ...(payload.trade && {
              tradename: {
                contains: payload.trade,
              },
            }),
          },
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
        },
        include: {
          dvat04: true,
        },
        skip: payload.skip,
        take: payload.take,
      }),
      prisma.returns_01.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          deletedById: null,
          dvat04: {
            selectOffice: payload.dept,
            ...(payload.tin && { tinNumber: payload.tin }),
            ...(payload.trade && {
              tradename: {
                contains: payload.trade,
              },
            }),
          },
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
        },
      }),
    ]);

    return createPaginationResponse({
      message: return_01
        ? "Return search Get successfully"
        : "Unable to search return.",
      functionname: functionname,
      data: return_01 ?? null,
      skip: payload.skip,
      take: payload.take,
      total: totalCount,
    });
  } catch (e) {
    return createPaginationResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SearchReturnPayment;
