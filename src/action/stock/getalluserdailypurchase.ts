"use server";

import { errorToString } from "@/utils/methods";
import {
  commodity_master,
  daily_purchase,
  tin_number_master,
} from "@prisma/client";
import prisma from "../../../prisma/database";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";

const GetALLUserDailyPurchase = async (): Promise<
  ApiResponseType<Array<
    daily_purchase & {
      commodity_master: commodity_master;
      seller_tin_number: tin_number_master;
    }
  > | null>
> => {
  const functionname: string = GetALLUserDailyPurchase.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return createResponse({
        message: "Not authenticated. Please login.",
        functionname,
      });
    }

    const daily_purchase_response = await prisma.daily_purchase.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        is_dvat_30a: false,
        dvat04Id: currentDvatId,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
      orderBy: [{ invoice_date: "desc" }],
    });

    if (!daily_purchase_response) {
      return createResponse({
        message: "No Daily Purchase found. Please try again.",
        functionname,
      });
    }

    return createResponse({
      message: "All Daily Purchase Data get successfully",
      functionname,
      data: daily_purchase_response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetALLUserDailyPurchase;
