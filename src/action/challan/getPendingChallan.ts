"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { challan } from "@prisma/client";
import prisma from "../../../prisma/database";

interface GetPendingChallanPayload {
  dvatid: number;
}

interface ChallanResponse {
  pending: number;
  count: number;
}

const GetPendingChallan = async (
  payload: GetPendingChallanPayload
): Promise<ApiResponseType<ChallanResponse | null>> => {
  const functionname: string = GetPendingChallan.name;

  try {
    const challan = await prisma.challan.findMany({
      where: {
        status: "ACTIVE",
        NOT: [
          {
            challanstatus: "PAID",
          },
        ],
        deletedAt: null,
        deletedById: null,
        dvatid: payload.dvatid,
      },
    });

    if (!challan) {
      return createResponse({
        message: "Unable to get challan.",
        functionname: functionname,
      });
    }

    let res_data: ChallanResponse = {
      count: 0,
      pending: 0,
    };

    for (let i = 0; i < challan.length; i++) {
      res_data.count += 1;
      res_data.pending += parseInt(challan[i].total_tax_amount);
    }

    return createResponse({
      message: challan ? "Challan Get successfully" : "Unable to get challan.",
      functionname: functionname,
      data: res_data,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetPendingChallan;
