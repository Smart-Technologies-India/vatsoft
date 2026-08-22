"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface DeleteTallyPurchasePayload {
  tallyIds: number[];
}

const DeleteTallyPurchase = async (
  payload: DeleteTallyPurchasePayload,
): Promise<ApiResponseType<boolean>> => {
  const functionname: string = DeleteTallyPurchase.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    // Verify that records belong to the current user's DVAT
    const records = await prisma.tally_purchase.findMany({
      where: {
        id: { in: payload.tallyIds },
        dvat04Id: currentDvatId,
        status: "ACTIVE",
      },
    });

    if (!records || records.length === 0) {
      return createResponse({
        message: "No valid tally purchase records found to delete.",
        functionname,
      });
    }

    // Delete the records
    const deleteResult = await prisma.tally_purchase.deleteMany({
      where: {
        id: { in: payload.tallyIds },
        dvat04Id: currentDvatId,
        status: "ACTIVE",
      },
    });

    if (deleteResult.count === 0) {
      return createResponse({
        message: "Failed to delete records.",
        functionname,
      });
    }

    return {
      status: true,
      data: true,
      message: `Successfully deleted ${deleteResult.count} tally purchase record(s).`,
      functionname,
    } as any;
  } catch (error) {
    console.error(`[${functionname}]`, error);
    return {
      status: false,
      data: null,
      message: errorToString(error),
      functionname,
    } as any;
  }
};

export default DeleteTallyPurchase;
