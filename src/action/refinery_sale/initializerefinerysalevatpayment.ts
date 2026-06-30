"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";
import { errorToString } from "@/utils/methods";

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
    expireDate.setDate(expireDate.getDate() + 3);
    const vatAmount = vatTotal.toFixed(2);
    const challanRemark = `REFINERY_SALE_VAT#${targetSale.invoice_number}#${targetSale.refineryId}#${targetSale.seller_tin_numberId}#${targetSale.id}`;

    const created = await prisma.challan.create({
      data: {
        dvatid: currentDvatId,
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
