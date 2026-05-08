"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";
import prisma from "../../../prisma/database";
import { Quarter, returns_01, Status } from "@prisma/client";

interface EnsureReturnForChallanPayload {
  createdById: number;
  year: string;
  quarter: Quarter;
  month: string;
}

const EnsureReturnForChallan = async (
  payload: EnsureReturnForChallanPayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname = EnsureReturnForChallan.name;

  try {
    let returnInvoice = await prisma.returns_01.findFirst({
      where: {
        year: payload.year,
        month: payload.month,
        createdById: payload.createdById,
        deletedAt: null,
        deletedById: null,
        return_type: "REVISED",
      },
    });

    if (!returnInvoice) {
      returnInvoice = await prisma.returns_01.findFirst({
        where: {
          year: payload.year,
          month: payload.month,
          createdById: payload.createdById,
          deletedAt: null,
          deletedById: null,
          return_type: "ORIGINAL",
        },
      });
    }

    if (!returnInvoice) {
      const dvat04 = await prisma.dvat04.findFirst({
        where: {
          createdById: payload.createdById,
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
          createdById: payload.createdById,
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
