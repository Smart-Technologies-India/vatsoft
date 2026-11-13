"use server";

import { getCurrentDvatId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";
import { liquor_wallet_history, dvat04 } from "@prisma/client";

export interface UserLiquorWalletTransactionWithRelations extends liquor_wallet_history {
  seller?: any;
}

interface GetUserLiquorWalletTransactionsPayload {
  dvatid: number;
  take?: number;
  skip?: number;
  invoice_number?: string;
  fromdate?: Date;
  todate?: Date;
}

interface GetUserLiquorWalletTransactionsResponse {
  result: UserLiquorWalletTransactionWithRelations[];
  total: number;
  take: number;
  skip: number;
}

const GetUserLiquorWalletTransactions = async (
  payload: GetUserLiquorWalletTransactionsPayload,
): Promise<
  ApiResponseType<GetUserLiquorWalletTransactionsResponse | null>
> => {
  const functionname = GetUserLiquorWalletTransactions.name;

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
      prisma.liquor_wallet_history.findMany({
        where,
        select: {
          id: true,
          dvatId: true,
          sellerId: true,
          seller: {
            select: {
              id: true,
              tin_number: true,
              name_of_dealer: true,
            },
          },
          old_wallet: true,
          new_wallet: true,
          amount: true,
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
      prisma.liquor_wallet_history.count({
        where,
      }),
    ]);

    return createResponse({
      message: "Liquor wallet transactions retrieved successfully.",
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

export default GetUserLiquorWalletTransactions;
