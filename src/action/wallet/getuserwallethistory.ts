"use server";

import { getCurrentDvatId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";
import { wallet_history, dvat04 } from "@prisma/client";

export interface UserWalletHistoryWithRelations extends wallet_history {
  refinery?: any;
}

interface GetUserWalletHistoryPayload {
  dvatid: number;
  take?: number;
  skip?: number;
  invoice_number?: string;
  fromdate?: Date;
  todate?: Date;
}

interface GetUserWalletHistoryResponse {
  result: UserWalletHistoryWithRelations[];
  total: number;
  take: number;
  skip: number;
}

const GetUserWalletHistory = async (
  payload: GetUserWalletHistoryPayload,
): Promise<ApiResponseType<GetUserWalletHistoryResponse | null>> => {
  const functionname = GetUserWalletHistory.name;

  try {
    const currentDvatId = await getCurrentDvatId();

    if (!currentDvatId) {
      return createResponse({
        message: "Not authenticated. Please login.",
        functionname,
      });
    }

    // Verify the requested dvatid matches current user's dvat
    if (payload.dvatid !== currentDvatId) {
      return createResponse({
        message: "Unauthorized access.",
        functionname,
      });
    }

    const take = payload.take || 10;
    const skip = payload.skip || 0;

    const where: any = {
      dvatId: payload.dvatid,
      deletedAt: null,
    };

    if (payload.invoice_number) {
      where.invoice_number = {
        contains: payload.invoice_number,
      };
    }

    if (payload.fromdate && payload.todate) {
      where.createdAt = {
        gte: payload.fromdate,
        lte: payload.todate,
      };
    }

    const [result, total] = await Promise.all([
      prisma.wallet_history.findMany({
        where,
        select: {
          id: true,
          dvatId: true,
          refineryId: true,
          old_quantity: true,
          new_quantity: true,
          old_amount: true,
          new_amount: true,
          old_wallet: true,
          new_wallet: true,
          difference_amount: true,
          invoice_number: true,
          type: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take,
        skip,
      }),
      prisma.wallet_history.count({
        where,
      }),
    ]);

    return createResponse({
      message: "Wallet history retrieved successfully.",
      functionname,
      data: {
        result,
        total,
        take,
        skip,
      },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetUserWalletHistory;
