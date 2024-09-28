"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { Dvat24Reason, order_notice } from "@prisma/client";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

interface CreateDvat24APayload {
  dvatid: number;
  dvat24_reason: Dvat24Reason;
  createdby: number;
  remark?: string;
  due_date: Date;
  issuedId: number;
  officerId: number;
  tax: string;
  interest: string;
  returns_01Id: number;
}

const CreateDvat24A = async (
  payload: CreateDvat24APayload
): Promise<ApiResponseType<order_notice | null>> => {
  const functionname: string = CreateDvat24A.name;
  let today = new Date();
  today.setDate(today.getDate() + 3);

  const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwyz", 12);
  const ref_no: string = nanoid();

  try {
    const challan = await prisma.order_notice.create({
      data: {
        dvatid: payload.dvatid,
        ref_no: ref_no,
        dvat24_reason: payload.dvat24_reason,
        due_date: payload.due_date,
        notice_order_type: "NOTICE",
        status: "PENDING",
        form_type: "DVAT24A",
        tax: payload.tax,
        interest: payload.interest,
        amount: (parseInt(payload.tax) + parseInt(payload.interest)).toString(),
        issuedId: payload.issuedId,
        officerId: payload.officerId,
        createdById: payload.createdby,
        returns_01Id: payload.returns_01Id,
        ...(payload.remark && { remark: payload.remark }),
      },
    });

    return createResponse({
      message: challan
        ? "DVAT24A create successfully"
        : "Unable to create DVAT24A.",
      functionname: functionname,
      data: challan ?? null,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateDvat24A;
