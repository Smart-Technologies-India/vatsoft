"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { challan } from "@prisma/client";
import prisma from "../../../prisma/database";

interface AddChallanPaymentPayload {
  userid: number;
  id: number;
  transaction_id: string;
  bank_name: string;
  track_id: string;
}

const AddChallanPayment = async (
  payload: AddChallanPaymentPayload
): Promise<ApiResponseType<challan | null>> => {
  const functionname: string = AddChallanPayment.name;

  try {
    const is_challan = await prisma.challan.findFirst({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
    });

    if (!is_challan) {
      return createResponse({
        message: "There is no challan.",
        functionname,
      });
    }
    const response = await prisma.challan.update({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        id: is_challan.id,
      },
      data: {
        track_id: payload.track_id,
        transaction_date: new Date(),
        transaction_id: payload.track_id,
        paymentmode: "ONLINE",
        bank_name: payload.bank_name,
        updatedById: payload.userid,
        challanstatus: "PAID",
      },
    });

    if (!response) {
      return createResponse({
        message: "Challan Payment Failed.",
        functionname: functionname,
      });
    }

    const udpate_order_notice = await prisma.order_notice.findFirst({
      where: {
        status: "PENDING",
        challanId: response.id,
        deletedAt: null,
        deletedBy: null,
      },
    });

    if (udpate_order_notice) {
      await prisma.order_notice.update({
        where: {
          id: udpate_order_notice.id,
        },
        data: {
          status: "PAID",
        },
      });
    }

    return createResponse({
      message: response
        ? "Challan payment completed successfully"
        : "Challan Payment Failed.",
      functionname: functionname,
      data: response ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AddChallanPayment;
