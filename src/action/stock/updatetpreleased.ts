"use server";

import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { getCurrentUserId } from "@/lib/auth";

interface UpdateTpReleasedPayload {
  transportPermitId: number;
}

const UpdateTpReleased = async (
  payload: UpdateTpReleasedPayload,
): Promise<ApiResponseType<{ success: boolean }>> => {
  const functionname: string = UpdateTpReleased.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return createResponse({
        message: "Not authenticated. Please login.",
        functionname,
      });
    }

    const transportPermit = await prisma.transport_permit.findUnique({
      where: {
        id: payload.transportPermitId,
      },
    });

    if (!transportPermit) {
      return createResponse({
        message: "Transport Permit not found.",
        functionname,
      });
    }

    if (!transportPermit.is_paid) {
      return createResponse({
        message: "Cannot release TP for unpaid permits.",
        functionname,
      });
    }

    const updatedPermit = await prisma.transport_permit.update({
      where: {
        id: payload.transportPermitId,
      },
      data: {
        tp_released: true,
        updated_at: new Date(),
      },
    });

    return createResponse({
      message: "Transport Permit released successfully.",
      data: { success: true },
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default UpdateTpReleased;
