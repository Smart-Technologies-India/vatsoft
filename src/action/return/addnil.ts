"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { DvatType, Quarter, Status, returns_entry } from "@prisma/client";
import { getCurrentDvatId } from "@/lib/auth";

interface AddNilPayload {
  year: string;
  month: string;
  quarter: Quarter;
  createdById: number;
  dvat_type: DvatType;
  seller_tin_numberId: number;
}

const AddNil = async (
  payload: AddNilPayload,
): Promise<ApiResponseType<returns_entry | null>> => {
  const functionname: string = AddNil.name;

  const dvatid = await getCurrentDvatId();

  if (!dvatid) {
    return createResponse({
      message: "Invalid id. Please try again.",
      functionname,
    });
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  try {
    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        id: dvatid,
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

    const purchase = await prisma.daily_purchase.findMany({
      where: {
        dvat04Id: dvat04.id,
        is_dvat_30a: false,
        deletedAt: null,
        deletedById: null,
        invoice_date: {
          gte: new Date(
            parseInt(payload.year),
            monthNames.indexOf(payload.month),
            1,
          ).toISOString(),
          lte: new Date(
            parseInt(payload.year),
            monthNames.indexOf(payload.month),
            31,
          ).toISOString(),
        },
      },
    });

    if (purchase.length > 0) {
      return createResponse({
        message: "Cannot add nil entry. Purchase entry exists for the month.",
        functionname,
      });
    }

    const sale = await prisma.daily_sale.findMany({
      where: {
        dvat04Id: dvat04.id,
        is_dvat_31: false,
        deletedAt: null,
        deletedById: null,
        invoice_date: {
          gte: new Date(
            parseInt(payload.year),
            monthNames.indexOf(payload.month),
            1,
          ).toISOString(),
          lte: new Date(
            parseInt(payload.year),
            monthNames.indexOf(payload.month),
            31,
          ).toISOString(),
        },
      },
    });

    if (sale.length > 0) {
      return createResponse({
        message: "Cannot add nil entry. Sale entry exists for the month.",
        functionname,
      });
    }

    const return_res = await prisma.returns_01.findFirst({
      where: {
        year: payload.year,
        quarter: payload.quarter,
        month: payload.month,
        dvat04Id: dvat04.id,
        status: Status.ACTIVE,
        OR: [
          {
            return_type: "ORIGINAL",
          },
          {
            return_type: "REVISED",
          },
        ],
      },
    });

    if (return_res) {
      const returnentryresponse = await prisma.returns_entry.create({
        data: {
          returns_01Id: return_res.id,
          dvat_type: payload.dvat_type,
          commodity_masterId: 1154,
          urn_number: "",
          total_invoice_number: "",
          invoice_number: "",
          description_of_goods: "Nil Filing",
          seller_tin_numberId: payload.seller_tin_numberId,
          status: Status.ACTIVE,
          invoice_date: new Date(
            parseInt(payload.year),
            monthNames.indexOf(payload.month),
            5,
          ).toISOString(),
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
          rr_number: "",
          return_type: "ORIGINAL",
          year: payload.year,
          quarter: payload.quarter,
          month: payload.month,
          dvat04Id: dvat04.id,
          filing_datetime: new Date(),
          file_status: Status.ACTIVE,
          total_tax_amount: "",
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
          commodity_masterId: 1154,
          description_of_goods: "Nil Filing",
          urn_number: "",
          total_invoice_number: "",
          invoice_number: "",
          seller_tin_numberId: payload.seller_tin_numberId,
          status: Status.ACTIVE,
          invoice_date: new Date(
            parseInt(payload.year),
            monthNames.indexOf(payload.month),
            5,
          ).toISOString(),
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
