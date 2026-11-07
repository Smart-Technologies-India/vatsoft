"use server";

import { getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface GetDvatSummaryPayload {
  dvatId: number;
}

interface DvatSummaryResponse {
  currentBalance: string;
  totalRecharge: string;
  totalUsed: string;
}

const GetDvatSummary = async (
  payload: GetDvatSummaryPayload,
): Promise<ApiResponseType<DvatSummaryResponse | null>> => {
  const functionname = GetDvatSummary.name;

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

    // Get the DVAT's current wallet balance
    const dvat = await prisma.dvat04.findFirst({
      where: {
        id: payload.dvatId,
        deletedAt: null,
      },
      select: {
        wallet: true,
      },
    });

    if (!dvat) {
      return createResponse({
        message: "DVAT not found.",
        functionname,
      });
    }

    // Get all transactions for this DVAT (no pagination)
    const allTransactions = await prisma.liquor_wallet_history.findMany({
      where: {
        dvatId: payload.dvatId,
        deletedAt: null,
      },
      select: {
        type: true,
        new_wallet: true,
        old_wallet: true,
      },
    });

    // Calculate totals from all transactions
    let totalRecharge = 0;
    let totalUsed = 0;

    allTransactions.forEach((trans) => {
      const newWallet = parseFloat(trans.new_wallet || "0");
      const oldWallet = parseFloat(trans.old_wallet || "0");
      const amount = Math.abs(newWallet - oldWallet);

      if (trans.type === "CREDIT") {
        totalRecharge += amount;
      } else if (trans.type === "DEBIT") {
        totalUsed += amount;
      }
    });

    return createResponse({
      message: "DVAT summary retrieved successfully.",
      functionname,
      data: {
        currentBalance: (parseFloat(dvat.wallet || "0")).toFixed(2),
        totalRecharge: totalRecharge.toFixed(2),
        totalUsed: totalUsed.toFixed(2),
      },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default GetDvatSummary;
