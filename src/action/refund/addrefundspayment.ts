"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { refunds } from "@prisma/client";
import prisma from "../../../prisma/database";

interface AddRefundsPaymentPayload {
  userid: number;
  id: number;
  transaction_id: string;
  bank_name: string;
  track_id: string;
}

const AddRefundsPayment = async (
  payload: AddRefundsPaymentPayload
): Promise<ApiResponseType<refunds | null>> => {
  const functionname: string = AddRefundsPayment.name;

  try {
    const is_refunds = await prisma.refunds.findFirst({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        id: payload.id,
      },
    });

    if (!is_refunds) {
      return createResponse({
        message: "There is no refunds.",
        functionname,
      });
    }
    const response = await prisma.refunds.update({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        id: is_refunds.id,
      },
      data: {
        track_id: payload.track_id,
        transaction_date: new Date(),
        transaction_id: payload.track_id,
        paymentmode: "ONLINE",
        bank_name: payload.bank_name,
        updatedById: payload.userid,
        refundsstatus: "PAID",
      },
    });

    return createResponse({
      message: response
        ? "Refunds payment completed successfully"
        : "Refunds Payment Failed.",
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

export default AddRefundsPayment;
