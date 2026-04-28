"use server";

import prisma from "../../../prisma/database";
import { ApiResponseType } from "@/models/response";
import { missing_invoice_complaint, MissingInvoiceStatus } from "@prisma/client";
import { errorToString } from "@/utils/methods";
import { getCurrentUserId } from "@/lib/auth";

interface UpdateMissingInvoiceStatusPayload {
  id: number;
  status: MissingInvoiceStatus;
}

const UpdateMissingInvoiceStatus = async (
  payload: UpdateMissingInvoiceStatusPayload,
): Promise<ApiResponseType<missing_invoice_complaint | null>> => {
  const functionname = UpdateMissingInvoiceStatus.name;

  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      status: false,
      message: "User not found. Please login again.",
      functionname,
      data: null,
    };
  }

  try {
    const updated = await prisma.missing_invoice_complaint.update({
      where: { id: payload.id },
      data: {
        status: payload.status,
        resolvedById: payload.status === "RESOLVED" || payload.status === "REJECTED" ? userId : null,
        resolvedAt: payload.status === "RESOLVED" || payload.status === "REJECTED" ? new Date() : null,
        updatedById: userId,
        updatedAt: new Date(),
      },
    });

    return {
      status: true,
      message: "Status updated successfully.",
      functionname,
      data: updated,
    };
  } catch (e) {
    return {
      status: false,
      message: errorToString(e),
      functionname,
      data: null,
    };
  }
};

export default UpdateMissingInvoiceStatus;
