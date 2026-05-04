"use server";

import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { Quarter, return_due } from "@prisma/client";
import { getCurrentUserId } from "@/lib/auth";

interface UpdateReturnDuePayload {
  id: number;
  year: number;
  quarter: Quarter;
  month: number;
  payment: number;
  filing: number;
}

const validateDay = (value: number): boolean => value >= 1 && value <= 31;

const UpdateReturnDue = async (
  payload: UpdateReturnDuePayload,
): Promise<ApiResponseType<return_due | null>> => {
  const functionname = UpdateReturnDue.name;

  const userId = await getCurrentUserId();
  if (!userId) {
    return createResponse({
      functionname,
      message: "User not found. Please login again.",
    });
  }

  try {
    if (!payload.id || Number.isNaN(payload.id)) {
      return createResponse({
        functionname,
        message: "Invalid return due entry id.",
      });
    }

    if (!payload.year || payload.year < 2000 || payload.year > 2100) {
      return createResponse({
        functionname,
        message: "Enter a valid year.",
      });
    }

    if (payload.month < 1 || payload.month > 12) {
      return createResponse({
        functionname,
        message: "Month must be between 1 and 12.",
      });
    }

    if (!validateDay(payload.payment) || !validateDay(payload.filing)) {
      return createResponse({
        functionname,
        message: "Payment and filing dates must be between 1 and 31.",
      });
    }

    const existing = await prisma.return_due.findFirst({
      where: {
        year: payload.year,
        quarter: payload.quarter,
        month: payload.month,
        id: {
          not: payload.id,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return createResponse({
        functionname,
        message: "Another entry already exists for this year, quarter and month.",
      });
    }

    const updated = await prisma.return_due.update({
      where: {
        id: payload.id,
      },
      data: {
        year: payload.year,
        quarter: payload.quarter,
        month: payload.month,
        payment: payload.payment,
        filing: payload.filing,
        updatedById: userId,
      },
    });

    return createResponse({
      functionname,
      message: "Return due date updated successfully.",
      data: updated,
    });
  } catch (e) {
    return createResponse({
      functionname,
      message: errorToString(e),
    });
  }
};

export default UpdateReturnDue;
