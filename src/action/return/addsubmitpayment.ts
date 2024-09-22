"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { returns_01 } from "@prisma/client";

interface AddSubmitPaymentPayload {
  id: number;
  rr_number: string;
  penalty: string;
}

const AddSubmitPayment = async (
  payload: AddSubmitPaymentPayload
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = AddSubmitPayment.name;
  try {
    const isExist = await prisma.returns_01.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        penalty: payload.penalty,
      },
    });

    if (!isExist) {
      return createResponse({ message: "Invalid Id, try again", functionname });
    }
    const updateresponse = await prisma.returns_01.update({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      data: {
        transaction_date: addPrismaDatabaseDate(new Date()).toISOString(),
        paymentmode: "ONLINE",
        rr_number: payload.rr_number,
      },
    });
    if (!updateresponse) {
      return createResponse({
        message: "Something Want wrong! Unable to submit",
        functionname,
      });
    }

    return createResponse({
      message: "Form submitted completed successfully.",
      functionname,
      data: updateresponse,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AddSubmitPayment;
