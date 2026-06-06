"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { Quarter, returns_01, Status } from "@prisma/client";

interface EnsureReturnForChallanPayload {
  year: string;
  quarter: Quarter;
  month: string;
}

const EnsureReturnForChallan = async (
  payload: EnsureReturnForChallanPayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname = EnsureReturnForChallan.name;

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "EnsureReturnForChallan",
      } as any;
    }

    let returnInvoice = await prisma.returns_01.findFirst({
      where: {
        year: payload.year,
        month: payload.month,
        dvat04Id: currentDvatId,
        deletedAt: null,
        deletedById: null,
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

    if (!returnInvoice) {
      const dvat04 = await prisma.dvat04.findFirst({
        where: {
          id: currentDvatId,
          deletedAt: null,
          deletedById: null,
        },
      });

      if (!dvat04) {
        return createResponse({
          functionname,
          message: "User DVAT profile not found.",
        });
      }

      returnInvoice = await prisma.returns_01.create({
        data: {
          rr_number: "",
          return_type: "ORIGINAL",
          year: payload.year,
          quarter: payload.quarter,
          month: payload.month,
          dvat04Id: dvat04.id,
          filing_datetime: new Date(),
          file_status: Status.ACTIVE,
          total_tax_amount: "0",
          status: Status.ACTIVE,
          compositionScheme: dvat04.compositionScheme,
          createdById: currentUserId,
        },
      });
    }

    return createResponse({
      functionname,
      message: "Return is ready for challan.",
      data: returnInvoice,
    });
  } catch (e) {
    return createResponse({
      functionname,
      message: errorToString(e),
    });
  }
};

export default EnsureReturnForChallan;
