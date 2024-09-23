"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { refunds } from "@prisma/client";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

interface CreateRefundPayload {
  dvatid: number;
  createdby: number;
  old_grievance_number?: string;
  oldcpin?: string;
  vat: string;
  cess: string;
  interest: string;
  penalty: string;
  others?: string;
  reason: string;
  remark?: string;
  total_tax_amount: string;
}

const CreateRefund = async (
  payload: CreateRefundPayload
): Promise<ApiResponseType<refunds | null>> => {
  const functionname: string = CreateRefund.name;
  let today = new Date();
  today.setDate(today.getDate() + 3);

  const nanoid = customAlphabet("1234567890", 12);

  const cpin: string = nanoid();

  try {
    const refunds_response = await prisma.refunds.create({
      data: {
        dvatid: payload.dvatid,
        cpin: cpin,
        vat: payload.vat,
        cess: payload.cess,
        interest: payload.cess,
        others: payload.others,
        penalty: payload.penalty,
        createdById: payload.createdby,
        expire_date: today,
        total_tax_amount: payload.total_tax_amount,
        status: "ACTIVE",
        reason: payload.reason,
        refundsstatus: "CREATED",
        dept_user_id: 8,
        ...(payload.remark && { remark: payload.remark }),
        ...(payload.old_grievance_number && {
          old_grievance_number: payload.old_grievance_number,
        }),
        ...(payload.oldcpin && { oldcpin: payload.oldcpin }),
      },
    });

    return createResponse({
      message: refunds_response
        ? "Challan create successfully"
        : "Unable to create challan.",
      functionname: functionname,
      data: refunds_response ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateRefund;
