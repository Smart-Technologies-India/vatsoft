"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { commodity_master, daily_sale, tin_number_master } from "@prisma/client";

interface GetByIdDailySalePayload {
  id: number;
}

const GetByIdDailySale = async (
  payload: GetByIdDailySalePayload
): Promise<
  ApiResponseType<
    | (daily_sale & {
        commodity_master: commodity_master;
        seller_tin_number: tin_number_master;
      })
    | null
  >
> => {
  const functionname: string = GetByIdDailySale.name;

  try {
    const response = await prisma.daily_sale.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        id: payload.id,
      },
      include:{
         commodity_master:true,
         seller_tin_number:true
      }
    });

    if (!response) {
      return createResponse({
        message: "No Daily Sale found. Please try again.",
        functionname,
      });
    }

    return createResponse({
      message: "All Daily Sale Data get successfully",
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

export default GetByIdDailySale;
