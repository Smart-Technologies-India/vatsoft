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
  penalty: string;
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
    const cpin: string = nanoid();

    const challan = await prisma.challan.create({
      data: {
        dvatid: payload.dvatid,
        cpin: cpin,
        vat: payload.tax,
        cess: "0",
        interest: payload.interest,
        others: "0",
        penalty: payload.penalty,
        createdById: payload.createdby,
        expire_date: today,
        total_tax_amount: (
          parseInt(payload.tax) + parseInt(payload.interest) + parseInt(payload.penalty)
        ).toString(),
        reason: "DEMAND",
        status: "ACTIVE",
        challanstatus: "CREATED",
        ...(payload.remark && { remark: payload.remark }),
      },
    });

    if (!challan) {
      return createResponse({
        message: "Failed to create challan for DVAT24A Order Notice",
        functionname: functionname,
      });
    }

    const order_notice_response = await prisma.order_notice.create({
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
        challanId: challan.id,
        ...(payload.remark && { remark: payload.remark }),
      },
    });

    if (!order_notice_response) {
      return createResponse({
        message: "Unable to create DVAT24.",
        functionname: functionname,
      });
    }

    return createResponse({
      message: "DVAT24A create successfully",
      functionname: functionname,
      data: order_notice_response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateDvat24A;
