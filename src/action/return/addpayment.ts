"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { returns_01 } from "@prisma/client";

interface AddPaymentPayload {
  id: number;
  bank_name: string;
  transaction_id: string;
  track_id: string;
  rr_number: string;
  penalty: string;
}

const AddPayment = async (
  payload: AddPaymentPayload
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = AddPayment.name;
  try {
    const isExist = await prisma.returns_01.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
    });

    if (!isExist) {
      return createResponse({ message: "Invalid Id, try again", functionname });
    }
    const updateresponse = await prisma.returns_01.update({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
      },
      data: {
        bank_name: payload.bank_name,
        track_id: payload.track_id,
        transaction_id: payload.transaction_id,
        transaction_date: addPrismaDatabaseDate(new Date()).toISOString(),
        paymentmode: "ONLINE",
        rr_number: payload.rr_number,
        penalty: payload.penalty,
        filing_datetime: new Date(),
      },
      include: {
        dvat04: true,
      },
    });
    if (!updateresponse) {
      return createResponse({
        message: "Something Want wrong! Unable to update",
        functionname,
      });
    }

    if (updateresponse.dvat04.compositionScheme) {
      const monthsToUpdate = getMonthGroup(updateresponse.month ?? "");
      await prisma.return_filing.updateMany({
        where: {
          filing_status: false,
          dvatid: updateresponse.dvat04Id,
          filing_date: null,
          year: updateresponse.year,
          month: { in: monthsToUpdate },
        },
        data: {
          filing_date: new Date(),
          filing_status: true,
        },
      });
    } else {
      await prisma.return_filing.updateMany({
        where: {
          filing_status: false,
          dvatid: updateresponse.dvat04Id,
          filing_date: null,
          year: updateresponse.year,
          month: updateresponse.month ?? "",
        },
        data: {
          filing_date: new Date(),
          filing_status: true,
        },
      });
    }

    return createResponse({
      message: "Payment completed successfully.",
      functionname,
      data: updateresponse,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AddPayment;

const getMonthGroup = (currentMonth: string): string[] => {
  const monthGroups = [
    ["April", "May", "June"],
    ["July", "August", "September"],
    ["October", "November", "December"],
    ["January", "February", "March"],
  ];

  // Find the group that contains the current month
  for (const group of monthGroups) {
    if (group.includes(currentMonth)) {
      return group;
    }
  }

  return [];
};
