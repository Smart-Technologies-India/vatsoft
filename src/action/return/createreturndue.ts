"use server";

import prisma from "../../../prisma/database";
import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import { Quarter, return_due } from "@prisma/client";
import { getCurrentUserId } from "@/lib/auth";

interface CreateReturnDuePayload {
  year: number;
  quarter: Quarter;
  month: number;
  payment: number;
  filing: number;
}

const validateDay = (value: number): boolean => value >= 1 && value <= 31;

const CreateReturnDue = async (
  payload: CreateReturnDuePayload,
): Promise<ApiResponseType<return_due | null>> => {
  const functionname = CreateReturnDue.name;

  const userId = await getCurrentUserId();
  if (!userId) {
    return createResponse({
      functionname,
      message: "User not found. Please login again.",
    });
  }

  try {
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
      },
      select: { id: true },
    });

    if (existing) {
      return createResponse({
        functionname,
        message: "Return due entry already exists for this year, quarter and month.",
      });
    }

    const created = await prisma.return_due.create({
      data: {
        year: payload.year,
        quarter: payload.quarter,
        month: payload.month,
        payment: payload.payment,
        filing: payload.filing,
        createdById: userId,
      },
    });

    return createResponse({
      functionname,
      message: "Return due date created successfully.",
      data: created,
    });
  } catch (e) {
    return createResponse({
      functionname,
      message: errorToString(e),
    });
  }
};

export default CreateReturnDue;
