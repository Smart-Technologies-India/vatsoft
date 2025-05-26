"use server";

import { errorToString } from "@/utils/methods";
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
        // return_type: "REVISED",
        OR: [
          {
            return_type: "REVISED",
          },
          {
            return_type: "ORIGINAL",
          },
        ],
      },
    });

    if (!isExist) {
      return createResponse({ message: "Invalid Id, try again", functionname });
    }

    if (
      isExist.rr_number == null ||
      isExist.rr_number == "" ||
      isExist.rr_number == undefined
    ) {
      return createResponse({
        data: false,
        message: "Payment not completed yet.",
        functionname,
      });
    }

    return createResponse({
      message: "Payment completed successfully.",
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
