"use server";

import { getCurrentDvatId, getCurrentUserId } from "@/lib/auth";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { customAlphabet } from "nanoid";
import { errorToString } from "@/utils/methods";
import { Quarter } from "@prisma/client";

interface AddWalletTransactionPayload {
  amount: number;
  remark?: string;
}

interface AddWalletTransactionResult {
  challanId: number;
  amount: string;
}

const AddWalletTransaction = async (
  payload: AddWalletTransactionPayload,
): Promise<ApiResponseType<AddWalletTransactionResult | null>> => {
  const functionname = AddWalletTransaction.name;
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
        deletedById: null,
        status: "APPROVED",
      },
      select: {
        id: true,
        wallet: true,
      },
    });

    if (!currentDvat) {
      return createResponse({
        message: "Current DVAT profile not found.",
        functionname,
      });
    }

    if (payload.amount <= 0) {
      return createResponse({
        message: "Amount must be greater than 0.",
        functionname,
      });
    }

    const amountStr = payload.amount.toFixed(2);
    const challanRemark = `WALLET_TOPUP#AMOUNT:${amountStr}#DATE:${new Date().toISOString().split("T")[0]}${payload.remark ? `#REMARK:${payload.remark}` : ""}`;

    // Get current date to determine month and year
    const currentDate = new Date();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    const currentYear = String(currentDate.getFullYear());

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

    // Check if a return already exists for current month/year
    let existingReturn = await prisma.returns_01.findFirst({
      where: {
        dvat04Id: currentDvatId,
        year: currentYear,
        month: months[parseInt(currentMonth) - 1],
        deletedAt: null,
        deletedById: null,
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
      const returnRemark = `AUTO_WALLET_TOPUP#${currentYear}#${currentMonth}`;
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

    // Create challan
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 7);

    const created = await prisma.challan.create({
      data: {
        dvatid: currentDvatId,
        returnid: returnId,
        cpin: cpinGenerator(),
        vat: amountStr,
        interest: "0",
        penalty: "0",
        latefees: "0",
        others: "0",
        total_tax_amount: amountStr,
        reason: "OTHERS",
        remark: challanRemark,
        paymentmode: "ONLINE",
        paymentstatus: "CREATED",
        expire_date: expireDate,
        createdById: currentUserId,
        updatedById: currentUserId,
        transaction_date: new Date(),
      },
    });

    // NOTE: Wallet update and wallet_history creation is now handled in
    // payment callback handler (ccavresponse.js) only when payment succeeds

    return createResponse({
      message: "Wallet top-up challan created successfully.",
      functionname,
      data: {
        challanId: created.id,
        amount: amountStr,
      },
    });
  } catch (error) {
    return createResponse({
      message: errorToString(error),
      functionname,
    });
  }
};

export default AddWalletTransaction;