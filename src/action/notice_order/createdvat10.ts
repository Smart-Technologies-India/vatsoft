"use server";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { order_notice } from "@prisma/client";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";
import dayjs from "dayjs";

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
      include: {
        dvat: {
          include: {
            createdBy: true,
          },
        },
      },
    });

    if (!order_notice) {
      return createResponse({
        message: "Unable to create DVAT10.",
        functionname: functionname,
      });
    }

    const mailmessage = `<!doctypehtml><html lang="en"><meta charset="UTF-8"><meta content="width=device-width,initial-scale=1"name="viewport"><style>*{margin:0;padding:0;box-sizing:border-box}body{width:100%;height:100vh;background-color:#f1f1f1}main{width:80%;margin:0 auto 0;background-color:#fff;box-shadow:0 0 10px rgba(0,0,0,.2);margin-top:50px;padding:20px}h1{text-align:center;font-size:40px;color:#333}h3{text-align:center;font-size:20px;color:#333}table{width:100%;border-collapse:collapse;margin-top:10px}.pricetable tbody tr:nth-child(even){background-color:#f1f1f1}.left{text-align:right}.pricetable tbody tr td{padding:6px 10px;font-size:16px;color:#333}hr{margin-top:20px}</style><main><h1>VAT-SOFT Smart</h1><h3>DVAT-10 Notice</h3><div style="height:20px;width:100%"></div><hr><table><tr style="font-size:20px"><td>Details Of User</table><table class="pricetable"><tr><td>User TIN Number:<td class="left">${
      order_notice.dvat.tinNumber
    }<tr><td>Name:<td class="left">${
      order_notice.dvat.tradename
    }<tr><td>Email:<td class="left">${
      order_notice.dvat.createdBy.email
    }<tr><td>Mobile:<td class="left">${
      order_notice.dvat.createdBy.mobileOne
    }<tr><td>Address:<td class="left">Silvassa</table><table><tr style="font-size:20px"><td>DVAT 10 Info<td class="left"></tbody><table class="pricetable"><tr><td>Reason For Notice:<td class="left">26000004005<tr><td>Due Date:<td class="left">${dayjs(
      order_notice.due_date
    ).format("DD/MM/YYYY")}<tr><td>Tax Period From:<td class="left">${dayjs(
      order_notice.tax_period_from
    ).format("DD/MM/YYYY")}<tr><td>Tax Period To:<td class="left">${dayjs(
      order_notice.tax_period_to
    ).format("DD/MM/YYYY")}<tr><td>Remark:<td class="left">${
      order_notice.remark
    }</table><hr><p>(See Rule 36 of the Dadra and Nagar Haveli and Daman and Diu Value Added Tax Rules, 2021)<p>Notice to return defaulter u/s 32 for not filing return. Type of Return: DVAT-16</main>`;

    return createResponse({
      message: "DVAT10 create successfully",
      functionname: functionname,
      data: order_notice,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateDvat10;
