"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { challan } from "@prisma/client";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

interface AddChallanPaymentPayload {
  userid: number;
  id: number;
  // transaction_id: string;
  // bank_name: string;
  // track_id: string;
}

const AddChallanPayment = async (
  payload: AddChallanPaymentPayload
): Promise<ApiResponseType<challan | null>> => {
  const functionname: string = AddChallanPayment.name;
  const createOrderId = customAlphabet("1234567890abcdef", 24);

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AddChallanPayment",
      } as any;
    }

    const is_challan = await prisma.challan.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        id: payload.id,
        dvatid: currentDvatId,
      },
    });

    if (!is_challan) {
      return createResponse({
        message: "There is no challan.",
        functionname,
      });
    }
    const orderId = createOrderId();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const response = await prisma.$transaction(async (tx) => {
      await tx.payment_intent.updateMany({
        where: {
          challanId: is_challan.id,
          status: {
            in: ["CREATED", "INITIATED"],
          },
          completedAt: null,
        },
        data: {
          status: "EXPIRED",
          completedAt: new Date(),
          failure_reason: "Superseded by a newer payment session.",
        },
      });

      const updatedChallan = await tx.challan.update({
        where: {
          deletedAt: null,
          deletedById: null,
          id: is_challan.id,
        },
        data: {
          transaction_date: new Date(),
          paymentmode: "ONLINE",
          updatedById: currentUserId,
          paymentstatus: "CREATED",
          order_id: orderId,
        },
      });

      await tx.payment_intent.create({
        data: {
          token: orderId,
          gateway_order_id: orderId,
          challanId: updatedChallan.id,
          dvatid: updatedChallan.dvatid,
          returnid: updatedChallan.returnid,
          type: "DEMAND",
          expected_amount: updatedChallan.total_tax_amount,
          status: "CREATED",
          expiresAt,
        },
      });

      return updatedChallan;
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
