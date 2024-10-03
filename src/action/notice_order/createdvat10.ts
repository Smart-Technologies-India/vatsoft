"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { order_notice } from "@prisma/client";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

interface CreateDvat10Payload {
  dvatid: number;
  createdby: number;
  remark?: string;
  tax_period_from: Date;
  tax_period_to: Date;
  due_date: Date;
  issuedId: number;
  officerId: number;
}

const CreateDvat10 = async (
  payload: CreateDvat10Payload
): Promise<ApiResponseType<order_notice | null>> => {
  const functionname: string = CreateDvat10.name;
  let today = new Date();
  today.setDate(today.getDate() + 3);

  const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwyz", 12);
  const ref_no: string = nanoid();

  try {
    const order_notice = await prisma.order_notice.create({
      data: {
        dvatid: payload.dvatid,
        ref_no: ref_no,
        dvat24_reason: "NOTFURNISHED",
        notice_order_type: "NOTICE",
        status: "PENDING",
        tax_period_from: payload.tax_period_from,
        tax_period_to: payload.tax_period_to,
        due_date: payload.due_date,
        form_type: "DVAT10",
        issuedId: payload.issuedId,
        officerId: payload.officerId,
        createdById: payload.createdby,
        ...(payload.remark && { remark: payload.remark }),
      },
    });

    return createResponse({
      message: order_notice
        ? "DVAT10 create successfully"
        : "Unable to create DVAT10.",
      functionname: functionname,
      data: order_notice ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateDvat10;
