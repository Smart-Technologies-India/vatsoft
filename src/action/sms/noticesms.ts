"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";

import prisma from "../../../prisma/database";
import axios from "axios";
import { getCurrentDvatId } from "@/lib/auth";

const maskMobile = (mobile: string): string => {
  if (mobile.length < 4) return "XXXX";
  return `XXXXXX${mobile.slice(-4)}`;
};

const SendSMSNotice = async (): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = SendSMSNotice.name;

  const dvatid = await getCurrentDvatId();

  if (!dvatid) {
    return createResponse({
      message: "Invalid id. Please try again.",
      functionname,
    });
  }

  const dvat_data = await prisma.dvat04.findFirst({
    where: {
      deletedAt: null,
      deletedBy: null,
      id: dvatid,

      // createdById: payload.userid,
      status: "APPROVED",
    },
  });

  if (!dvat_data)
    return createResponse({
      message: "Invalid id. Please try again.",
      functionname,
    });

  try {
    const encodedMessage = encodeURIComponent(
      `Dear ${dvat_data.tinNumber}-${dvat_data.tradename}, Notice has been issued against your VAT account for return not filed. Kindly check the VAT portal for details. -VAT DDD.`,
    );

    await axios.get(
      `http://sms.smartechwebworks.com/submitsms.jsp?user=dddnhvat&key=781358d943XX&mobile=+91${dvat_data.contact_one}&message=${encodedMessage}&senderid=VATDDD&accusage=1&entityid=1701174159851422588&tempid=1707174989483820875`,
    );

    return createResponse({
      message: `OTP sent successfully to ${maskMobile(dvat_data.contact_one ?? "9999999999")}.`,
      data: true,
      functionname,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default SendSMSNotice;
