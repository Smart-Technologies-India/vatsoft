"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  CategoryOfEntry,
  dvat04,
  DvatType,
  PurchaseType,
  returns_01,
  ReturnType,
  SelectOffice,
} from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { customAlphabet } from "nanoid";
import {
  CentralSalesCalculation,
  NetTaxCalculation,
  R4Turnover,
  R5Turnover,
  TheBalance,
} from "@/components/dvatreturn/vatcalculation";

interface AddPaymentPayload {
  id: number;
  bank_name: string;
  transaction_id: string;
  track_id: string;
  rr_number: string;
  penalty: string;
  pending_payment?: string;
  vatamount: string;
  interestamount: string;
  totaltaxamount: string;
  challan_vat: string;
  challan_interest: string;
  challan_penalty: string;
  challan_other?: string;
  challan_total_tax_amount: string;
  pending_cash?: string;
}

const AddPayment = async (
  payload: AddPaymentPayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = AddPayment.name;
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
        functionname: "AddPayment",
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

      // For new component logic: component calls this separately for each return with already-determined values
      // Just update the specific return, don't divide or find other quarterly returns
      const transactionDate = new Date();
      const filingDate = new Date();

      const returnresponse = await prisma.returns_01.update({
        where: {
          id: payload.id,
        },
        data: {
          bank_name: payload.bank_name,
          track_id: payload.track_id,
          transaction_id: payload.transaction_id,
          transaction_date: transactionDate,
          paymentmode: "ONLINE",
          rr_number: payload.rr_number,
          penalty: payload.penalty,
          filing_datetime: filingDate,
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
          is_quarterly: isExist.dvat04.frequencyFilings == "QUARTERLY",
        },
        include: {
          dvat04: true,
        },
      });

      if (!returnresponse) {
        throw new Error("Something went wrong! Unable to update");
      }

      // const isQuarterlyFiling =
      //   returnresponse.dvat04.frequencyFilings == "QUARTERLY";
      // await updateReturns01Work(isQuarterlyFiling, returnresponse);

      const updateresponse = await prisma.returns_01.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedById: null,
        },
        include: {
          dvat04: true,
        },
      });

      if (!updateresponse) {
        throw new Error("Something went wrong! Unable to update");
      }

      // Get monthly targets for filing status update (still needed for quarterly months)
      const monthsToUpdate = getTargetMonths(
        updateresponse.month ?? "",
        updateresponse.dvat04.frequencyFilings === "QUARTERLY",
      );

      const isComp = updateresponse.dvat04.compositionScheme ?? false;

      const getFilingDueDate = (month: string, year: string): Date => {
        const monthNames = [
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
        const monthIndex = monthNames.indexOf(month);
        const yearNum = parseInt(year, 10);

        if (isComp) {
          if (["January", "February", "March"].includes(month))
            return new Date(yearNum, 3, 28); // April 28
          if (["April", "May", "June"].includes(month))
            return new Date(yearNum, 6, 28); // July 28
          if (["July", "August", "September"].includes(month))
            return new Date(yearNum, 9, 28); // October 28
          return new Date(yearNum + 1, 0, 28); // January 28 next year
        }

        const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
        const nextYear = monthIndex === 11 ? yearNum + 1 : yearNum;
        return new Date(nextYear, nextMonth, 28);
      };

      await Promise.all(
        monthsToUpdate.map((month) => {
          const dueDate = getFilingDueDate(month, updateresponse.year);
          const returnStatus = dueDate >= filingDate ? "FILED" : "LATEFILED";

          return prisma.return_filing.upsert({
            where: {
              dvatid_year_month: {
                dvatid: updateresponse.dvat04Id,
                year: updateresponse.year,
                month,
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
              month,
              filing_date: filingDate,
              filing_status: true,
              return_status: returnStatus,
              due_date: dueDate,
              status: "ACTIVE",
              createdById: payload.id,
            },
          });
        }),
      );

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

export default AddPayment;

const getTargetMonths = (
  currentMonth: string,
  isCompositionScheme: boolean,
): string[] => {
  if (!currentMonth) {
    return [];
  }

  return isCompositionScheme ? getMonthGroup(currentMonth) : [currentMonth];
};

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

const getQuarterlyDistributedAmount = (
  value: string,
  isQuarterlyFiling: boolean,
): string => {
  if (!isQuarterlyFiling) {
    return value;
  }

  const parsedValue = parseFloat(value || "0");

  if (Number.isNaN(parsedValue)) {
    return value;
  }

  return (parsedValue / 3).toFixed(2);
};

function getFromDateAndToDate(
  year: string,
  month: string,
): { fromDate: string; toDate: string } {
  const monthNames = [
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

  // Get the current month index
  const monthIndex = monthNames.indexOf(month);
  if (monthIndex === -1) {
    throw new Error("Invalid month name");
  }

  // Calculate the `toDate`
  // const toYear = month === "March" ? parseInt(year) + 1 : parseInt(year);
  const toYear = parseInt(year);
  const toDate = new Date(toYear, monthIndex + 1, 0); // Last day of the month

  // Calculate the `fromDate` (current month - 2 months)
  const fromDate = new Date(parseInt(year), monthIndex - 2, 1); // First day of the month

  // Format the dates to DD-MM-YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return {
    fromDate: formatDate(fromDate),
    toDate: formatDate(toDate),
  };
}

const getsrno = (
  selectOffice: SelectOffice,
  last: number,
  offset: number = 0,
): string => {
  let pre =
    selectOffice == SelectOffice.Dadra_Nagar_Haveli
      ? "DNH"
      : selectOffice == SelectOffice.DAMAN
        ? "DD"
        : "DIU";
  let value1 =
    selectOffice == SelectOffice.Dadra_Nagar_Haveli
      ? "01"
      : selectOffice == SelectOffice.DAMAN
        ? "02"
        : "03";

  return `${pre}/${value1}/C/${last + offset + 1}`;
};
const getsrnofform = (
  selectOffice: SelectOffice,
  last: number,
  offset: number = 0,
): string => {
  let pre =
    selectOffice == SelectOffice.Dadra_Nagar_Haveli
      ? "DNH"
      : selectOffice == SelectOffice.DAMAN
        ? "DD"
        : "DIU";
  let value1 =
    selectOffice == SelectOffice.Dadra_Nagar_Haveli
      ? "01"
      : selectOffice == SelectOffice.DAMAN
        ? "02"
        : "03";

  return `${pre}/${value1}/F/${last + offset + 1}`;
};
