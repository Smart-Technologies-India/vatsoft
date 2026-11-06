"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";
import { wallet_history, dvat04 } from "@prisma/client";

export interface AllUsersWalletHistoryWithDvat extends wallet_history {
  dvat?: {
    id: number;
    tinNumber: string | null;
    name: string | null;
    wallet: string | null;
  } | null;
}

interface GetAllUsersWalletTransactionPayload {
  take?: number;
  skip?: number;
  invoice_number?: string;
  fromdate?: Date;
  todate?: Date;
  dvatid?: number;
  searchTin?: string;
}

interface GetAllUsersWalletTransactionResponse {
  result: AllUsersWalletHistoryWithDvat[];
  total: number;
  take: number;
  skip: number;
  allDvats: Array<{
    id: number;
    tinNumber: string | null;
    name: string | null;
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

    if (payload.invoice_number) {
      where.invoice_number = {
        contains: payload.invoice_number,
      };
    }

    if (payload.dvatid) {
      where.dvatId = payload.dvatid;
    }

    if (payload.fromdate && payload.todate) {
      where.createdAt = {
        gte: payload.fromdate,
        lte: payload.todate,
      };
    }

    // Fetch all dvat04 users
    const allDvats = await prisma.dvat04.findMany({
      where: {
        deletedAt: null,
        status: "APPROVED",
      },
      select: {
        id: true,
        tinNumber: true,
        name: true,
        wallet: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Apply TIN search filter if provided
    let dvatFilter = allDvats;
    if (payload.searchTin) {
      dvatFilter = allDvats.filter(
        (d) =>
          (d.tinNumber && d.tinNumber.includes(payload.searchTin!)) ||
          (d.name && d.name.toLowerCase().includes(payload.searchTin!.toLowerCase())),
      );
    }

    const dvatIds = dvatFilter.map((d) => d.id);

    if (dvatIds.length > 0) {
      where.dvatId = {
        in: dvatIds,
      };
    } else {
      where.dvatId = {
        in: [],
      };
    }

    const [result, total] = await Promise.all([
      prisma.wallet_history.findMany({
        where,
        include: {
          dvat: {
            select: {
              id: true,
              tinNumber: true,
              name: true,
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
      prisma.wallet_history.count({
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
