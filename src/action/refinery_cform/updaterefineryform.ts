"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { cform } from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

interface UpdateRefineryCformPayload {
  id: number;
  seller_name?: string;
  seller_tin_no?: string;
  seller_address?: string;
  amount?: string;
  valid_date?: Date;
}

const UpdateRefineryCform = async (
  payload: UpdateRefineryCformPayload,
): Promise<ApiResponseType<cform | null>> => {
  const functionname: string = UpdateRefineryCform.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: functionname,
      };
    }

    // Verify ownership
    const cformData = await prisma.cform.findFirst({
      where: {
        id: payload.id,
        dvat04Id: currentDvatId,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
    });

    if (!cformData) {
      return {
        status: false,
        data: null,
        message: "C-Form not found or access denied.",
        functionname: functionname,
      };
    }

    const updatedCform = await prisma.cform.update({
      where: {
        id: payload.id,
      },
      data: {
        ...(payload.seller_name && { seller_name: payload.seller_name }),
        ...(payload.seller_tin_no && { seller_tin_no: payload.seller_tin_no }),
        ...(payload.seller_address && {
          seller_address: payload.seller_address,
        }),
        ...(payload.amount && { amount: payload.amount }),
        ...(payload.valid_date && { valid_date: payload.valid_date }),
      },
    });

    return createResponse({
      message: "C-Form updated successfully.",
      functionname: functionname,
      data: updatedCform,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname: functionname,
      data: null,
    });
  }
};

export default UpdateRefineryCform;
