"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import {
  commodity_master,
  daily_purchase,
  tin_number_master,
} from "@prisma/client";

interface GetByIdDailyPurchasePayload {
  id: number;
}

const GetByIdDailyPurchase = async (
  payload: GetByIdDailyPurchasePayload
): Promise<
  ApiResponseType<
    | (daily_purchase & {
        commodity_master: commodity_master;
        seller_tin_number: tin_number_master;
      })
    | null
  >
> => {
  const functionname: string = GetByIdDailyPurchase.name;

  try {
    const response = await prisma.daily_purchase.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        id: payload.id,
      },
      include: {
        commodity_master: true,
        seller_tin_number: true,
      },
    });

    if (!response) {
      return createResponse({
        message: "No Daily Purchase found. Please try again.",
        functionname,
      });
    }

    return createResponse({
      message: "All Daily Purchase Data get successfully",
      functionname,
      data: response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetByIdDailyPurchase;
