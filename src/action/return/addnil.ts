"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { DvatType, Quarter, Status, returns_entry } from "@prisma/client";

interface AddNilPayload {
  year: string;
  month: string;
  quarter: Quarter;
  createdById: number;
  dvat_type: DvatType;
  seller_tin_numberId: number;
}

const AddNil = async (
  payload: AddNilPayload
): Promise<ApiResponseType<returns_entry | null>> => {
  const functionname: string = AddNil.name;
  try {
    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        createdById: payload.createdById,
        deletedAt: null,
        deletedById: null,
        status: "APPROVED",
      },
    });

    if (!dvat04) {
      return createResponse({
        message: "User Dvat04 not found.",
        functionname,
      });
    }

    let return_res = await prisma.returns_01.findFirst({
      where: {
        year: payload.year,
        quarter: payload.quarter,
        month: payload.month,
        status: Status.ACTIVE,
        createdById: payload.createdById,
      },
    });

    if (return_res) {
      const returnentryresponse = await prisma.returns_entry.create({
        data: {
          returns_01Id: return_res.id,
          dvat_type: payload.dvat_type,
          urn_number: "",
          total_invoice_number: "",
          invoice_number: "",
          seller_tin_numberId: payload.seller_tin_numberId,
          status: Status.ACTIVE,
          invoice_date: new Date().toISOString(),
          createdById: payload.createdById,
          isnil: true,
        },
      });

      if (!returnentryresponse)
        return {
          status: false,
          data: null,
          message: "Invalid id. Please try again.",
          functionname: "AddReturnInvoice",
        };

      return {
        status: true,
        data: returnentryresponse,
        message: "Return Invoice Created successfully",
        functionname: "AddReturnInvoice",
      };
    } else {
      const return_invoice = await prisma.returns_01.create({
        data: {
          rr_number: "0",
          return_type: "ORIGNAL",
          year: payload.year,
          quarter: payload.quarter,
          month: payload.month,
          dvat04Id: dvat04.id,
          filing_datetime: new Date(),
          file_status: Status.ACTIVE,
          total_tax_amount: "0",
          status: Status.ACTIVE,
          createdById: payload.createdById,
          compositionScheme: dvat04.compositionScheme,
        },
      });

      if (!return_invoice) {
        return createResponse({
          message: "Return invoice is not created.",
          functionname,
        });
      }

      const returnentryresponse = await prisma.returns_entry.create({
        data: {
          returns_01Id: return_invoice.id,
          dvat_type: payload.dvat_type,
          urn_number: "",
          total_invoice_number: "",
          invoice_number: "",
          seller_tin_numberId: payload.seller_tin_numberId,
          status: Status.ACTIVE,
          invoice_date: new Date().toISOString(),
          createdById: payload.createdById,
          isnil: true,
        },
      });

      if (!returnentryresponse)
        return {
          status: false,
          data: null,
          message: "Invalid id. Please try again.",
          functionname: "AddReturnInvoice",
        };

      return {
        status: true,
        data: returnentryresponse,
        message: "Return Invoice Created successfully",
        functionname: "AddReturnInvoice",
      };
    }
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AddNil;
