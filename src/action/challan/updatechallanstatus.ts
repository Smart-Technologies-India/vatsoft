"use server";
import prisma from "../../../prisma/database";


export type UpdateChallanStatusParams = {
  challanId: number;
  orderStatus?: string;
  statusGroup?: string;
  orderStatusDateTime?: string;
  bankRefNo?: string;
  cardName?: string;
  paymentMode?: string;
  statusCode?: string;
  statusMessage?: string;
  responseCode?: string;
  failureMessage?: string;
  transactionDate?: Date;
  tracking_id?: string;
  orderFeeFlat?: string | number;
  orderTax?: string | number;
};

const isSuccessfulGatewayStatus = (status?: string) => {
  const normalizedStatus = status?.toString().trim().toLowerCase();
  return (
    normalizedStatus === "successful" ||
    normalizedStatus === "success" ||
    normalizedStatus === "shipped"
  );
};

const toNumber = (value?: string | number) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export default async function UpdateChallanStatus(
  params: UpdateChallanStatusParams,
) {
  try {
    const updateData: Record<string, unknown> = {};
    const isSuccessfulPayment =
      params.statusGroup === "success" ||
      isSuccessfulGatewayStatus(params.orderStatus);

    if (params.orderStatus !== undefined) {
      updateData.order_status = isSuccessfulPayment
        ? "Successful"
        : params.orderStatus;
    }

    if (params.orderStatusDateTime !== undefined) {
      updateData.transaction_date = new Date(params.orderStatusDateTime);
    } else if (params.transactionDate !== undefined) {
      updateData.transaction_date = params.transactionDate;
    }

    if (params.bankRefNo !== undefined) {
      updateData.bank_name = params.bankRefNo;
    }

    if (params.cardName !== undefined) {
      updateData.card_name = params.cardName;
    }

    if (params.paymentMode !== undefined) {
      updateData.paymentmode = params.paymentMode;
    }

    if (params.statusCode !== undefined) {
      updateData.status_code = params.statusCode;
    }

    if (params.statusMessage !== undefined) {
      updateData.status_message = params.statusMessage;
    }

    if (params.responseCode !== undefined) {
      updateData.response_code = params.responseCode;
    }

    if (params.failureMessage !== undefined) {
      updateData.failure_message = params.failureMessage;
    }

    if(params.tracking_id !== undefined) {
      updateData.track_id = params.tracking_id;
    }

    if (isSuccessfulPayment) {
      updateData.paymentstatus = "PAID";

      const orderFeeFlat = toNumber(params.orderFeeFlat);
      const orderTax = toNumber(params.orderTax);

      if (orderFeeFlat !== null && orderTax !== null) {
        updateData.trans_fee = (orderFeeFlat + orderTax).toFixed(4);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return {
        status: true,
        message: "No updates provided",
        data: null,
      };
    }

    const updated = await prisma.challan.update({
      where: { id: params.challanId },
      data: updateData,
    });

    return {
      status: true,
      message: "Challan status updated successfully",
      data: updated,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      status: false,
      message: `Failed to update challan status: ${errorMessage}`,
      data: null,
    };
  }
}
