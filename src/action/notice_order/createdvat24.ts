"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { Dvat24Reason, order_notice } from "@prisma/client";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

interface CreateDvat24Payload {
  dvatid: number;
  dvat24_reason: Dvat24Reason;
  createdby: number;
  remark?: string;
  tax_period_from: Date;
  tax_period_to: Date;
  due_date: Date;
  issuedId: number;
  officerId: number;
  tax: string;
  latefees: string;
  interest: string;
  penalty: string;
  others?: string;
  returns_01Id: number;
}

const CreateDvat24 = async (
  payload: CreateDvat24Payload
): Promise<ApiResponseType<order_notice | null>> => {
  const functionname: string = CreateDvat24.name;
  let today = new Date();
  today.setDate(today.getDate() + 3);

  const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwyz", 12);
  const ref_no: string = nanoid();

  try {
    const cpin: string = nanoid();
    const totalTaxAmount: number =
      (parseFloat(payload.tax) || 0) +
      (parseFloat(payload.latefees) || 0) +
      (parseFloat(payload.interest) || 0) +
      (parseFloat(payload.penalty) || 0) +
      (parseFloat(payload.others ?? "0") || 0);

    const challan = await prisma.challan.create({
      data: {
        dvatid: payload.dvatid,
        cpin: cpin,
        vat: payload.tax,
        latefees: payload.latefees,
        interest: payload.interest,
        others: payload.others ?? "0",
        penalty: payload.penalty,
        createdById: payload.createdby,
        expire_date: today,
        total_tax_amount: totalTaxAmount.toString(),
        reason: "DEMAND",
        paymentstatus: "CREATED",
        ...(payload.remark && { remark: payload.remark }),
      },
    });

    if (!challan) {
      return createResponse({
        message: "Failed to create challan for DVAT24 Order Notice",
        functionname: functionname,
      });
    }

    const order_notice_response = await prisma.order_notice.create({
      data: {
        returns_01Id: payload.returns_01Id,
        dvatid: payload.dvatid,
        ref_no: ref_no,
        dvat24_reason: payload.dvat24_reason,
        due_date: payload.due_date,
        notice_order_type: "NOTICE",
        status: "PENDING",
        tax_period_from: payload.tax_period_from,
        tax_period_to: payload.tax_period_to,
        form_type: "DVAT24",
        tax: payload.tax,
        interest: payload.interest,
        penalty: payload.penalty,
        latefees: payload.latefees,
        others: payload.others ?? "0",
        amount: totalTaxAmount.toString(),
        issuedId: payload.issuedId,
        officerId: payload.officerId,
        createdById: payload.createdby,
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
      message: "DVAT24 create successfully",
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

export default CreateDvat24;
