"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface CheckPaymentPayload {
  id: number;
}

const CheckPayment = async (
  payload: CheckPaymentPayload
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = CheckPayment.name;
  try {
    const isExist = await prisma.returns_01.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
    });

    if (!isExist) {
      return createResponse({ message: "Invalid Id, try again", functionname });
    }

    if (
      isExist.track_id == null &&
      isExist.transaction_id == null &&
      isExist.bank_name == null &&
      isExist.transaction_date == null
    ) {
      return createResponse({
        data: false,
        message: "Payment not completed yet.",
        functionname,
      });
    }

    return createResponse({
      message: "Payment complted successfully.",
      functionname,
      data: true,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CheckPayment;