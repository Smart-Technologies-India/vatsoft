"use server";

import { errorToString } from "@/utils/methods";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { returns_01, SelectOffice } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetAllReturnPaymentPayload {
  rr_number?: string;
  tin?: string;
  trade?: string;
  fromdate?: Date;
  todate?: Date;
  dept?: SelectOffice;
}

const GetAllReturnPayment = async (
  payload: GetAllReturnPaymentPayload,
): Promise<{
  status: boolean;
  data?: Array<returns_01 & { dvat04: any }>;
  message: string;
}> => {
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        message: "Not authenticated. Please login.",
      };
    }

    const allData = await prisma.returns_01.findMany({
      where: {
        OR: [
          {
            status: "LATE",
          },
          {
            status: "PAID",
          },
        ],
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
        dvat04: {
          select: {
            id: true,
            tinNumber: true,
            tradename: true,
            name: true,
            compositionScheme: true,
          },
        },
      },
      orderBy: {
        transaction_date: "desc",
      },
    });

    return {
      status: true,
      data: allData,
      message: "All return payment data retrieved successfully",
    };
  } catch (error) {
    return {
      status: false,
      message: errorToString(error),
    };
  }
};

export default GetAllReturnPayment;
