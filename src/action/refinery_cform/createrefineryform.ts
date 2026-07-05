"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { cform } from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { customAlphabet } from "nanoid";

interface CreateRefineryCformPayload {
  seller_name: string;
  seller_tin_no: string;
  seller_address: string;
  amount: string;
  office_of_issue: string;
  from_period: Date;
  to_period: Date;
  valid_date: Date;
}

const CreateRefineryCform = async (
  payload: CreateRefineryCformPayload,
): Promise<ApiResponseType<cform | null>> => {
  const functionname: string = CreateRefineryCform.name;
  const nanoid = customAlphabet("1234567890", 12);

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();

    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: functionname,
      };
    }

    // Get dvat04 details
    const dvat04 = await prisma.dvat04.findFirst({
      where: {
        id: currentDvatId,
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!dvat04) {
      return {
        status: false,
        data: null,
        message: "DVAT account not found.",
        functionname: functionname,
      };
    }

    // Get the last C-form to generate next SR No
    const lastCform = await prisma.cform.findFirst({
      where: {
        status: "ACTIVE",
        office_of_issue: payload.office_of_issue as any,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const lastOfficeSerial = lastCform
      ? parseInt(lastCform.sr_no.split("/").pop() ?? "0", 10) || 0
      : 0;

    // Generate SR No (format: OFFICE/SERIES/NUMBER)
    const srNo = `${payload.office_of_issue}/${new Date().getFullYear()}/${lastOfficeSerial + 1}`;

    const cformData = await prisma.cform.create({
      data: {
        amount: payload.amount,
        dvat04Id: currentDvatId,
        office_of_issue: payload.office_of_issue as any,
        date_of_issue: new Date(),
        valid_date: payload.valid_date,
        sr_no: srNo,
        seller_address: payload.seller_address,
        seller_name: payload.seller_name,
        seller_tin_no: payload.seller_tin_no,
        cform_type: "ORIGINAL",
        from_period: payload.from_period,
        to_period: payload.to_period,
        status: "ACTIVE",
        createdById: currentUserId,
      },
    });

    return createResponse({
      message: "C-Form created successfully.",
      functionname: functionname,
      data: cformData,
    });
  } catch (e) {
    return {
      status: false,
      data: null,
      message: errorToString(e),
      functionname: functionname,
    };
  }
};

export default CreateRefineryCform;
