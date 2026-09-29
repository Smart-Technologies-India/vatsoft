"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import {
  CategoryOfEntry,
  challan,
  DvatType,
  PurchaseType,
  ReturnType,
  SelectOffice,
} from "@prisma/client";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
import { customAlphabet } from "nanoid";

interface AddPaymentOnlinePayload {
  id: number;
  // rr_number: string;
  penalty: string;
  pending_payment?: string;
  vatamount: string;
  interestamount: string;
  totaltaxamount: string;
  challan_vat: string;
  challan_interest: string;
  challan_penalty: string;
  challan_other?: string;
  pending_cash?: string;
  challan_total_tax_amount: string;
}

const AddPaymentOnline = async (
  payload: AddPaymentOnlinePayload,
): Promise<ApiResponseType<challan | null>> => {
  const functionname: string = AddPaymentOnline.name;
  const nanoid = customAlphabet("1234567890", 12);
  const createOrderId = customAlphabet("1234567890abcdef", 24);

  const cpin: string = nanoid();

  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AddPaymentOnline",
      } as any;
    }

    const result: challan = await prisma.$transaction(async (prisma) => {
      const isExist = await prisma.returns_01.findFirst({
        where: {
          id: payload.id,
          dvat04Id: currentDvatId,
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
      const filingDate = new Date();

      await prisma.returns_01.update({
        where: {
          id: payload.id,
        },
        data: {
          penalty: payload.penalty,
          filing_datetime: filingDate,
          challan_number: cpin,
          other_charge: payload.challan_other ?? "0",
          ...(payload.pending_payment && {
            pending_payment: payload.pending_payment,
          }),
          ...(payload.pending_cash && {
            cash_payment: payload.pending_cash,
          }),
          interest: payload.interestamount,
          vatamount: payload.vatamount,
          total_tax_amount: (
            parseFloat(payload.totaltaxamount) +
            parseFloat(payload.challan_other ?? "0")
          ).toString(),
          is_quarterly: isExist.dvat04.frequencyFilings == "QUARTERLY",
        },
      });

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

      await prisma.return_filing.findMany({
        where: {
          filing_status: false,
          deletedAt: null,
          deletedById: null,
          dvatid: updateresponse.dvat04Id,
          filing_date: null,
          year: updateresponse.year,
          month: { in: monthsToUpdate },
        },
      });

      let today = new Date();
      today.setDate(today.getDate() + 7);

      const challan_response = await prisma.challan.create({
        data: {
          dvatid: isExist.dvat04Id,
          cpin: cpin,
          vat: payload.challan_vat,
          latefees: "0",
          interest: payload.challan_interest,
          others: payload.challan_other ?? "0",
          penalty: payload.challan_penalty,
          createdById: isExist.createdById,
          expire_date: today,
          total_tax_amount: payload.challan_total_tax_amount,
          reason: "MONTHLYPAYMENT",
          paymentstatus: "CREATED",
          transaction_date: new Date(),
          paymentmode: "ONLINE",
          returnid: isExist.id,
          // track_id: payload.track_id,
          // bank_name: payload.bank_name,
        },
      });

      if (!challan_response) {
        throw new Error(`Challan was not created`);
      }

      const orderId = createOrderId();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.payment_intent.updateMany({
        where: {
          challanId: challan_response.id,
          status: {
            in: ["CREATED", "INITIATED"],
          },
          completedAt: null,
        },
        data: {
          status: "EXPIRED",
          completedAt: new Date(),
          failure_reason: "Superseded by a newer payment session.",
        },
      });

      const challanWithOrder = await prisma.challan.update({
        where: {
          id: challan_response.id,
        },
        data: {
          order_id: orderId,
        },
      });

      await prisma.payment_intent.create({
        data: {
          token: orderId,
          gateway_order_id: orderId,
          challanId: challanWithOrder.id,
          dvatid: challanWithOrder.dvatid,
          returnid: challanWithOrder.returnid,
          type: "DEMAND",
          expected_amount: challanWithOrder.total_tax_amount,
          status: "CREATED",
          expiresAt,
        },
      });

      return challanWithOrder;
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

export default AddPaymentOnline;

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
