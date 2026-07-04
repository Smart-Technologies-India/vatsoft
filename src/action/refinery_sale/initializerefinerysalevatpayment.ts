"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";
import { errorToString } from "@/utils/methods";
import { Quarter } from "@prisma/client";

interface InitializeRefinerySaleVatPaymentPayload {
  id: number;
}

interface InitializeRefinerySaleVatPaymentResult {
  challanId: number;
  vatAmount: string;
}

const InitializeRefinerySaleVatPayment = async (
  payload: InitializeRefinerySaleVatPaymentPayload,
): Promise<ApiResponseType<InitializeRefinerySaleVatPaymentResult | null>> => {
  const functionname = InitializeRefinerySaleVatPayment.name;
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

    const currentDvat = await prisma.dvat04.findFirst({
      where: {
        id: currentDvatId,
        deletedAt: null,
      },
      select: {
        tin_master_id: true,
      },
    });

    if (!currentDvat) {
      return createResponse({
        message: "Current DVAT profile not found.",
        functionname,
      });
    }

    const targetSale = await prisma.refinery_sale.findFirst({
      where: {
        id: payload.id,
        seller_tin_numberId: currentDvat.tin_master_id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        invoice_number: true,
        invoice_date: true,
        refineryId: true,
        seller_tin_numberId: true,
      },
    });

    if (!targetSale) {
      return createResponse({
        message: "Invoice not found for current DVAT.",
        functionname,
      });
    }

    const saleRows = await prisma.refinery_sale.findMany({
      where: {
        invoice_number: targetSale.invoice_number,
        invoice_date: targetSale.invoice_date,
        refineryId: targetSale.refineryId,
        seller_tin_numberId: targetSale.seller_tin_numberId,
        refinery_status: "SALE",
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      select: {
        vatamount: true,
      },
    });

    if (saleRows.length === 0) {
      return createResponse({
        message: "Tax is already paid for this invoice.",
        functionname,
      });
    }

    const vatTotal = saleRows.reduce((sum, row) => {
      const vat = Number.parseFloat(row.vatamount || "0");
      return sum + (Number.isFinite(vat) ? vat : 0);
    }, 0);

    if (vatTotal <= 0) {
      return createResponse({
        message: "VAT amount is invalid for payment.",
        functionname,
      });
    }

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 7);
    const vatAmount = vatTotal.toFixed(2);
    const challanRemark = `REFINERY_SALE_VAT#${targetSale.invoice_number}#${targetSale.refineryId}#${targetSale.seller_tin_numberId}#${targetSale.id}`;

    // Get current date to determine month and year
    const currentDate = new Date();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0"); // 01-12
    const currentYear = String(currentDate.getFullYear());

    // Check if a return already exists for current month/year
    let existingReturn = await prisma.returns_01.findFirst({
      where: {
        dvat04Id: currentDvatId,
        year: currentYear,
        month: currentMonth,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    let returnId: number;

    const monthsnames = [
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

    const quarters: Record<string, Quarter> = {
      April: Quarter.QUARTER1,
      May: Quarter.QUARTER1,
      June: Quarter.QUARTER1,
      July: Quarter.QUARTER2,
      August: Quarter.QUARTER2,
      September: Quarter.QUARTER2,
      October: Quarter.QUARTER3,
      November: Quarter.QUARTER3,
      December: Quarter.QUARTER3,
      January: Quarter.QUARTER4,
      February: Quarter.QUARTER4,
      March: Quarter.QUARTER4,
    };

    // If return doesn't exist, create a new one
    if (!existingReturn) {
      const returnRemark = `AUTO_REFINERY_SALE_VAT#${currentYear}#${currentMonth}`;
      const newReturn = await prisma.returns_01.create({
        data: {
          rr_number: ``,
          return_type: "ORIGINAL",
          year: currentYear,
          month: monthsnames[parseInt(currentMonth) - 1],
          quarter: quarters[monthsnames[parseInt(currentMonth) - 1]],
          dvat04Id: currentDvatId,
          file_status: "ACTIVE",
          remarks: returnRemark,
          status: "ACTIVE",
          createdById: currentUserId,
          updatedById: currentUserId,
          filing_datetime: new Date(),
        },
      });
      returnId = newReturn.id;
    } else {
      returnId = existingReturn.id;
    }

    const created = await prisma.challan.create({
      data: {
        dvatid: currentDvatId,
        returnid: returnId,
        cpin: cpinGenerator(),
        vat: vatAmount,
        interest: "0",
        penalty: "0",
        latefees: "0",
        others: "0",
        total_tax_amount: vatAmount,
        reason: "MONTHLYPAYMENT",
        remark: challanRemark,
        paymentmode: "ONLINE",
        paymentstatus: "CREATED",
        expire_date: expireDate,
        createdById: currentUserId,
        updatedById: currentUserId,
        transaction_date: new Date(),
      },
    });

    return createResponse({
      message: "Refinery VAT challan created successfully.",
      functionname,
      data: {
        challanId: created.id,
        vatAmount,
      },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default InitializeRefinerySaleVatPayment;
