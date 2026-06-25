"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { refinery_sale } from "@prisma/client";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";

interface ChangeRefinerySalesPayload {
  refineryId: number;
  refinerysaleId: number;
}

const ChangeRefinerySales = async (
  payload: ChangeRefinerySalesPayload,
): Promise<ApiResponseType<refinery_sale | null>> => {
  const functionname = ChangeRefinerySales.name;

  try {
    const refinerySale = await prisma.refinery_sale.findFirst({
      where: {
        id: payload.refinerysaleId,
        deletedAt: null,
        refinery_status: "VATPAID",
      },
    });

    if (!refinerySale) {
      return createResponse({
        functionname,
        message: "Refinery sale not found or not in VATPAID status.",
      });
    }

    const updatedata = await prisma.refinery_sale.update({
      where: {
        id: payload.refinerysaleId,
      },
      data: {
        refineryId: payload.refineryId,
      },
    });

    if (!updatedata) {
      return createResponse({
        functionname,
        message: "Failed to update refinery sale.",
      });
    }

    return {
      status: true,
      data: updatedata,
      message: "Refinery updated successfully.",
      functionname,
    };
  } catch (error) {
    return {
      status: false,
      data: null,
      message: errorToString(error),
      functionname,
    };
  }
};

export default ChangeRefinerySales;
