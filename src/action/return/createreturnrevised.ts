"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { Status, returns_entry } from "@prisma/client";

interface CreateReturnRevisedPayload {
  id: number;
}

const CreateReturnRevised = async (
  payload: CreateReturnRevisedPayload
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = CreateReturnRevised.name;

  try {
    let return01exist = await prisma.returns_01.findFirst({
      where: {
        id: payload.id,
        status: "ACTIVE",
        deletedAt: null,
        deletedById: null,
        return_type: "ORIGINAL",
      },
    });

    if (!return01exist) {
      return createResponse({
        message: "Return not found.",
        functionname,
      });
    }

    const return01 = await prisma.returns_01.create({
      data: {
        rr_number: "",
        return_type: "REVISED",
        year: return01exist.year,
        quarter: return01exist.quarter,
        month: return01exist.month,
        dvat04Id: return01exist.dvat04Id,
        filing_datetime: return01exist.filing_datetime,
        file_status: return01exist.file_status,
        vatamount: return01exist.vatamount,
        interest: return01exist.interest,
        compositionScheme: return01exist.compositionScheme,
        remarks: return01exist.remarks,
        status: return01exist.status,
        createdById: return01exist.createdById,
      },
    });

    if (!return01) {
      return createResponse({
        message: "Unable to create new Return01.",
        functionname,
      });
    }

    const return_entry = await prisma.returns_entry.findMany({
      where: {
        deletedAt: null,
        deletedById: null,
        returns_01Id: return01exist.id,
        isnil: false,
      },
    });

    if (!return_entry) {
      return createResponse({
        message: "Unable to find return entry.",
        functionname,
      });
    }

    const returnentryresponse = await prisma.returns_entry.createMany({
      data: return_entry.map((return_entry: returns_entry) => ({
        returns_01Id: return01.id,
        dvat_type: return_entry.dvat_type,
        urn_number: return_entry.urn_number,
        invoice_number: return_entry.invoice_number,
        total_invoice_number: return_entry.total_invoice_number,
        invoice_date: return_entry.invoice_date.toISOString(),
        seller_tin_numberId: return_entry.seller_tin_numberId,
        category_of_entry: return_entry.category_of_entry,
        sale_of: return_entry.sale_of,
        sale_of_interstate: return_entry.sale_of_interstate,
        input_tax_credit: return_entry.input_tax_credit,
        nature_purchase: return_entry.nature_purchase,
        purchase_type: return_entry.purchase_type,
        nature_purchase_option: return_entry.nature_purchase_option,
        place_of_supply: return_entry.place_of_supply,
        tax_percent: return_entry.tax_percent,
        amount: return_entry.amount,
        vatamount: return_entry.vatamount,
        remarks: return_entry.remarks,
        description_of_goods: return_entry.description_of_goods,
        status: Status.ACTIVE,
        createdById: return_entry.createdById,
      })),
    });

    if (!returnentryresponse)
      return createResponse({
        message: "Unable to initiate revised return.",
        functionname,
      });

    return createResponse({
      message: "Kindly submit revised return.",
      functionname,
      data: true,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateReturnRevised;
