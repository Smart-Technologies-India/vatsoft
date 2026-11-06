"use server";

import { getCurrentDvatId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";
import { wallet_history, dvat04 } from "@prisma/client";

export interface AllUserWalletHistoryWithRelations extends wallet_history {
  refinery?: any;
}

interface GetAllUserWalletHistoryPayload {
  dvatid: number;
  take?: number;
  skip?: number;
  invoice_number?: string;
  fromdate?: Date;
  todate?: Date;
}

interface GetAllUserWalletHistoryResponse {
  result: AllUserWalletHistoryWithRelations[];
  total: number;
  take: number;
  skip: number;
  totalWalletBalance?: string;
  totalRechargeAmount?: string;
  totalUsedAmount?: string;
}

const GetAllUserWalletHistory = async (
  payload: GetAllUserWalletHistoryPayload,
): Promise<ApiResponseType<GetAllUserWalletHistoryResponse | null>> => {
  const functionname = GetAllUserWalletHistory.name;

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

    const [result, total, dvatData] = await Promise.all([
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
      prisma.dvat04.findUnique({
        where: {
          id: payload.dvatid,
        },
        select: {
          wallet: true,
        },
      }),
    ]);

    // Calculate totals
    const allTransactions = await prisma.wallet_history.findMany({
      where: {
        dvatId: payload.dvatid,
        deletedAt: null,
      },
      select: {
        type: true,
        difference_amount: true,
      },
    });

    let totalRecharge = 0;
    let totalUsed = 0;

    allTransactions.forEach((trans) => {
      const amount = parseFloat(trans.difference_amount || "0");
      if (trans.type === "CREDIT") {
        totalRecharge += amount;
      } else if (trans.type === "DEBIT") {
        totalUsed += amount;
      }
    });

    return createResponse({
      message: "Wallet history retrieved successfully.",
      functionname,
      data: {
        result,
        total,
        take,
        skip,
        totalWalletBalance: dvatData?.wallet || "0",
        totalRechargeAmount: totalRecharge.toFixed(2),
        totalUsedAmount: totalUsed.toFixed(2),
      },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetAllUserWalletHistory;
