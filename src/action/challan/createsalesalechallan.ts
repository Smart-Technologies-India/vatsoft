"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";
import { Quarter, ReturnType, Status } from "@prisma/client";

interface CreateSaleChallanPayload {
  saleId: number;
}

interface CreateSaleChallanResult {
  challanId: number;
  isPaid: boolean;
}

const getSaleRemark = (invoiceNumber: string, dvatId: number) =>
  `SALE_LIQUOR#${invoiceNumber}#${dvatId}`;

const CreateSaleChallan = async (
  payload: CreateSaleChallanPayload,
): Promise<ApiResponseType<CreateSaleChallanResult | null>> => {
  const functionname: string = CreateSaleChallan.name;
  const cpinGenerator = customAlphabet("1234567890", 12);

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    const sale = await prisma.daily_sale.findFirst({
      where: {
        id: payload.saleId,
        dvat04Id: currentDvatId,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      include: { seller_tin_number: true, dvat04: true },
    });

    if (!sale) {
      return createResponse({
        message: "Sale invoice not found.",
        functionname,
      });
    }

    const remark = getSaleRemark(sale.invoice_number, currentDvatId);

    const existingChallans = await prisma.challan.findMany({
      where: {
        dvatid: currentDvatId,
        remark,
        deletedAt: null,
        deletedById: null,
      },
      orderBy: { id: "desc" },
    });

    const paidChallan = existingChallans.find(
      (c) => c.paymentstatus === "PAID",
    );
    if (paidChallan) {
      return createResponse({
        message: "VAT is already paid for this invoice.",
        functionname,
        data: { challanId: paidChallan.id, isPaid: true },
      });
    }

    const invoiceRows = await prisma.daily_sale.findMany({
      where: {
        dvat04Id: currentDvatId,
        invoice_number: sale.invoice_number,
        seller_tin_numberId: sale.seller_tin_numberId,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      select: { vatamount: true },
    });

    const totalVat = invoiceRows.reduce(
      (sum, row) => sum + (Number.parseFloat(row.vatamount) || 0),
      0,
    );

    if (totalVat <= 0) {
      return createResponse({
        message: "There is no VAT amount payable for this invoice.",
        functionname,
      });
    }

    const totalVatStr = totalVat.toFixed(2);

    const reusable = existingChallans.find(
      (c) =>
        c.paymentstatus !== "PAID" &&
        c.total_tax_amount === totalVatStr &&
        c.expire_date > new Date(),
    );
    if (reusable) {
      return createResponse({
        message: "Challan already exists for this invoice.",
        functionname,
        data: { challanId: reusable.id, isPaid: false },
      });
    }

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 7);

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    let returndata = await prisma.returns_01.findFirst({
      where: {
        dvat04Id: currentDvatId,
        year: sale.invoice_date.getFullYear().toString(),
        month: months[sale.invoice_date.getMonth()],
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!returndata) {
      const dvatdate = await prisma.dvat04.findUnique({
        where: { id: currentDvatId, deletedAt: null, deletedById: null },
      });

      if (!dvatdate) {
        throw new Error("DVAT record not found");
      }
      returndata = await prisma.returns_01.create({
        data: {
          rr_number: "",
          return_type: ReturnType.ORIGINAL,
          year: sale.invoice_date.getFullYear().toString(),
          month: months[sale.invoice_date.getMonth()],
          quarter: getQuarter(months[sale.invoice_date.getMonth()]),
          dvat04Id: currentDvatId,
          filing_datetime: new Date(),
          file_status: Status.ACTIVE,
          total_tax_amount: "0",
          status: Status.ACTIVE,
          compositionScheme: dvatdate.compositionScheme,
          createdById: currentUserId,
        },
      });
    }

    const created = await prisma.challan.create({
      data: {
        dvatid: currentDvatId,
        cpin: cpinGenerator(),
        vat: totalVatStr,
        interest: "0",
        penalty: "0",
        latefees: "0",
        others: "0",
        total_tax_amount: totalVatStr,
        reason: "MONTHLYPAYMENT",
        remark,
        paymentmode: "ONLINE",
        paymentstatus: "CREATED",
        expire_date: expireDate,
        createdById: currentUserId,
        updatedById: currentUserId,
        returnid: returndata.id,
      },
    });

    return createResponse({
      message: "Challan created successfully.",
      functionname,
      data: { challanId: created.id, isPaid: false },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default CreateSaleChallan;

function getQuarter(month: string): Quarter {
  const quarters: Record<string, Quarter> = {
    January: "QUARTER3",
    February: "QUARTER3",
    March: "QUARTER3",
    April: "QUARTER4",
    May: "QUARTER4",
    June: "QUARTER4",
    July: "QUARTER1",
    August: "QUARTER1",
    September: "QUARTER1",
    October: "QUARTER2",
    November: "QUARTER2",
    December: "QUARTER2",
  };
  return quarters[month] ?? "QUARTER1";
}
