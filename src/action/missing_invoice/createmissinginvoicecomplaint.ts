"use server";

import prisma from "../../../prisma/database";
import { ApiResponseType } from "@/models/response";
import { missing_invoice_complaint } from "@prisma/client";
import { errorToString } from "@/utils/methods";
import { safeParse } from "valibot";
import { MissingInvoiceComplaintSchema } from "@/schema/missinginvoice";
import { getCurrentUserId } from "@/lib/auth";

const CreateMissingInvoiceComplaint = async (
  data: unknown
): Promise<ApiResponseType<missing_invoice_complaint | null>> => {
  const functionname = CreateMissingInvoiceComplaint.name;

  const parsed = safeParse(MissingInvoiceComplaintSchema, data);

  if (!parsed.success) {
    const errors = parsed.issues.map((issue) => issue.message).join(", ");
    return {
      status: false,
      message: errors,
      functionname,
      data: null,
    };
  }

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
    const created = await prisma.missing_invoice_complaint.create({
      data: {
        dvat04Id: parsed.output.dvat04Id,
        invoice_type: parsed.output.invoice_type,
        invoice_number: parsed.output.invoice_number,
        taxable_amount: parsed.output.taxable_amount,
        vat_amount: parsed.output.vat_amount,
        invoice_date: parsed.output.invoice_date,
        supplier_tin:
          parsed.output.supplier_tin && parsed.output.supplier_tin.length > 0
            ? parsed.output.supplier_tin
            : null,
        customer_tin_no:
          parsed.output.customer_tin_no &&
          parsed.output.customer_tin_no.length > 0
            ? parsed.output.customer_tin_no
            : null,
        customer_name:
          parsed.output.customer_name && parsed.output.customer_name.length > 0
            ? parsed.output.customer_name
            : null,
        complaint_message: parsed.output.complaint_message ?? "",
        createdById: userId,
      },
    });

    return {
      status: true,
      message: "Missing invoice complaint created successfully",
      functionname,
      data: created,
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

export default CreateMissingInvoiceComplaint;
