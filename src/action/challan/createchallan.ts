"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { challan, ChallanReason } from "@prisma/client";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";

interface CreateChallanPayload {
  dvatid: number;
  returnid?: number;
  createdby: number;
  vat: string;
  interest: string;
  penalty: string;
  others: string;
  latefees: string;
  reason: ChallanReason;
  remark?: string;
  total_tax_amount: string;
}

const CreateChallan = async (
  payload: CreateChallanPayload
): Promise<ApiResponseType<challan | null>> => {
  const functionname: string = CreateChallan.name;
  let today = new Date();
  today.setDate(today.getDate() + 3);

  const nanoid = customAlphabet("1234567890", 12);

  const cpin: string = nanoid();

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "CreateChallan",
      } as any;
    }

    const challan = await prisma.challan.create({
      data: {
        dvatid: payload.dvatid,
        ...(payload.returnid != null && { returnid: payload.returnid }),
        cpin: cpin,
        vat: payload.vat,
        latefees: payload.latefees,
        interest: payload.interest,
        others: payload.others,
        penalty: payload.penalty,
        createdById: payload.createdby,
        expire_date: today,
        total_tax_amount: payload.total_tax_amount,
        reason: payload.reason,
        paymentstatus: "CREATED",
        ...(payload.remark && { remark: payload.remark }),
      },
    });

    return createResponse({
      message: challan
        ? "Challan create successfully"
        : "Unable to create challan.",
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

export default CreateChallan;
