"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";
import { liquor_wallet_history, dvat04 } from "@prisma/client";

export interface AllUsersWalletHistoryWithDvat extends liquor_wallet_history {
  dvat?: {
    id: number;
    tinNumber: string | null;
    tradename: string | null;
    wallet: string | null;
  } | null;
}

interface GetAllUsersWalletTransactionPayload {
  take?: number;
  skip?: number;
  dvatid?: number;
  searchTinOrName?: string;
}

interface GetAllUsersWalletTransactionResponse {
  result: AllUsersWalletHistoryWithDvat[];
  total: number;
  take: number;
  skip: number;
  allDvats: Array<{
    id: number;
    tinNumber: string | null;
    tradename: string | null;
    wallet: string | null;
  }>;
}

const GetAllUsersWalletTransaction = async (
  payload: GetAllUsersWalletTransactionPayload,
): Promise<ApiResponseType<GetAllUsersWalletTransactionResponse | null>> => {
  const functionname = GetAllUsersWalletTransaction.name;

  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      return createResponse({
        message: "Not authenticated. Please login.",
        functionname,
      });
    }

    // Verify user has permission to view all data
    const currentUser = await prisma.user.findFirst({
      where: {
        id: currentUserId,
        deletedAt: null,
      },
    });

    if (!currentUser) {
      return createResponse({
        message: "User not found.",
        functionname,
      });
    }

    // Check if user has permission (should be admin or officer)
    const allowedRoles = [
      "ADMIN",
      "VATOFFICER",
      "DY_COMMISSIONER",
      "JOINT_COMMISSIONER",
    ];
    if (!allowedRoles.includes(currentUser.role)) {
      return createResponse({
        message: "You don't have permission to view this report.",
        functionname,
      });
    }

    const take = payload.take || 10;
    const skip = payload.skip || 0;

    const where: any = {
      deletedAt: null,
    };

    if (payload.dvatid) {
      where.dvatId = payload.dvatid;
    }

    // Get distinct DVATs that have entries in liquor_wallet_history
    const dvatIdWithHistory = await prisma.liquor_wallet_history.findMany({
      where: {
        deletedAt: null,
      },
      distinct: ["dvatId"],
      select: {
        dvatId: true,
      },
    });

    const dvatIdsInHistory = dvatIdWithHistory
      .map((h) => h.dvatId)
      .filter((id): id is number => id !== null);

    // Fetch DVATs that have wallet history entries
    let allDvats = await prisma.dvat04.findMany({
      where: {
        id: {
          in: dvatIdsInHistory,
        },
        deletedAt: null,
        status: "APPROVED",
      },
      select: {
        id: true,
        tinNumber: true,
        tradename: true,
        wallet: true,
      },
      orderBy: {
        tradename: "asc",
      },
    });

    // Apply TIN/tradename search filter if provided - only if no dvatid is specified
    if (payload.searchTinOrName && !payload.dvatid) {
      const searchLower = payload.searchTinOrName.toLowerCase();
      allDvats = allDvats.filter(
        (d) =>
          (d.tinNumber && d.tinNumber.toLowerCase().includes(searchLower)) ||
          (d.tradename && d.tradename.toLowerCase().includes(searchLower)),
      );

      const filteredDvatIds = allDvats.map((d) => d.id);

      if (filteredDvatIds.length > 0) {
        where.dvatId = {
          in: filteredDvatIds,
        };
      } else {
        where.dvatId = {
          in: [],
        };
      }
    }

    const [result, total] = await Promise.all([
      prisma.liquor_wallet_history.findMany({
        where,
        include: {
          dvat: {
            select: {
              id: true,
              tinNumber: true,
              tradename: true,
              wallet: true,
            },
          },
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
      message: "All users wallet transactions retrieved successfully.",
      functionname,
      data: {
        result,
        total,
        take,
        skip,
        allDvats,
      },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetAllUsersWalletTransaction;
