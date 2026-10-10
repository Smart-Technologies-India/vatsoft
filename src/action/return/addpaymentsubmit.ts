"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { returns_01 } from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { customAlphabet } from "nanoid";
import dayjs, { Dayjs } from "dayjs";

interface AddPaymentSubmitPayload {
  id: number;
  rr_number: string;
  penalty: string;
  pending_payment?: string;
  vatamount: string;
  interestamount: string;
  totaltaxamount: string;
  pending_cash?: string;
}

const AddPaymentSubmit = async (
  payload: AddPaymentSubmitPayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = AddPaymentSubmit.name;
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
        functionname: "AddPaymentSubmit",
      } as any;
    }

    const result: returns_01 = await prisma.$transaction(async (prisma) => {
      const isExist = await prisma.returns_01.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          OR: [
            {
              return_type: "REVISED",
            },
            {
              return_type: "ORIGINAL",
            },
          ],
        },
        include: {
          dvat04: true,
        },
      });

      if (!isExist) {
        throw new Error("Invalid Id, try again");
      }
      const updateresponse = await prisma.returns_01.update({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
        },
        data: {
          transaction_date: new Date(),
          paymentmode: "ONLINE",
          rr_number: payload.rr_number,
          penalty: payload.penalty,
          filing_datetime: new Date(),
          challan_number: cpin,
          ...(payload.pending_payment && {
            pending_payment: payload.pending_payment,
          }),
          ...(payload.pending_cash && {
            cash_payment: payload.pending_cash,
          }),
          interest: payload.interestamount,
          vatamount: payload.vatamount,
          total_tax_amount: payload.totaltaxamount,
          status: "PAID",
          track_id: "0",
          transaction_id: "0",
          is_quarterly: isExist.dvat04.frequencyFilings == "QUARTERLY",
        },
        include: {
          dvat04: true,
        },
      });
      if (!updateresponse) {
        throw new Error("Something went wrong! Unable to update");
      }

      const isQuarterlyFiling =
        updateresponse.dvat04.frequencyFilings == "QUARTERLY";

      // await updateReturns01Work(isQuarterlyFiling, updateresponse);

      const filingDate = new Date();

      if (updateresponse.dvat04.compositionScheme || isQuarterlyFiling) {
        const monthsToUpdate = getMonthGroup(updateresponse.month ?? "");

        // Upsert for each month - create if not found, update if found
        for (const month of monthsToUpdate) {
          const dueDate = isQuarterlyFiling
            ? GetCompDueDate(updateresponse.year, month).toDate()
            : dayjs(`${updateresponse.year}-${getMonthIndex(month) + 1}-01`)
                .add(1, "month")
                .date(28)
                .toDate();

          const returnStatus = dueDate >= filingDate ? "FILED" : "LATEFILED";

          await prisma.return_filing.upsert({
            where: {
              dvatid_year_month: {
                dvatid: updateresponse.dvat04Id,
                year: updateresponse.year,
                month: month,
              },
            },
            update: {
              filing_date: filingDate,
              filing_status: true,
              return_status: returnStatus,
            },
            create: {
              dvatid: updateresponse.dvat04Id,
              year: updateresponse.year,
              month: month,
              filing_date: filingDate,
              filing_status: true,
              return_status: returnStatus,
              status: "ACTIVE",
              createdById: currentUserId,
              due_date: dueDate.toISOString(),
            },
          });
        }
      } else {
        // Upsert for single month - create if not found, update if found
        const month = updateresponse.month ?? "";
        const dueDate = dayjs(
          `${updateresponse.year}-${getMonthIndex(month) + 1}-01`,
        )
          .add(1, "month")
          .date(28)
          .toDate();

        const returnStatus = dueDate >= filingDate ? "FILED" : "LATEFILED";

        await prisma.return_filing.upsert({
          where: {
            dvatid_year_month: {
              dvatid: updateresponse.dvat04Id,
              year: updateresponse.year,
              month: month,
            },
          },
          update: {
            filing_date: filingDate,
            filing_status: true,
            return_status: returnStatus,
          },
          create: {
            dvatid: updateresponse.dvat04Id,
            year: updateresponse.year,
            month: month,
            filing_date: filingDate,
            filing_status: true,
            return_status: returnStatus,
            status: "ACTIVE",
            createdById: currentUserId,
            due_date: dueDate.toISOString(),
          },
        });
      }

      return updateresponse;
    });

    return createResponse({
      message: "Payment completed successfully.",
      functionname,
      data: result,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default AddPaymentSubmit;

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

const getMonthIndex = (monthName: string): number => {
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
  return months.indexOf(monthName);
};
const GetCompDueDate = (year: string, month: string): Dayjs => {
  let nextMonth: number;

  // Determine the next month based on the input month
  if (["April", "May", "June"].includes(month)) {
    nextMonth = 6; // July
  } else if (["July", "August", "September"].includes(month)) {
    nextMonth = 9; // October
  } else if (["October", "November", "December"].includes(month)) {
    nextMonth = 0; // January of next year
  } else if (["January", "February", "March"].includes(month)) {
    nextMonth = 3; // April
  } else {
    nextMonth = new Date(parseInt(year), 0).getMonth(); // Default case (though this shouldn't occur)
  }

  // Create the due date using Day.js and convert it to a Date object
  return dayjs(
    `${parseInt(year) + (nextMonth === 0 ? 1 : 0)}-${nextMonth + 1}-29`,
  );
};
