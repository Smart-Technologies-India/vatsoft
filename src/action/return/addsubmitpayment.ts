"use server";

import { addPrismaDatabaseDate, errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";
import { returns_01, SelectOffice } from "@prisma/client";

import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";
interface AddSubmitPaymentPayload {
  id: number;
  rr_number: string;
  penalty: string;
}

const AddSubmitPayment = async (
  payload: AddSubmitPaymentPayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = AddSubmitPayment.name;
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "AddSubmitPayment",
      } as any;
    }

    const result: returns_01 = await prisma.$transaction(async (prisma) => {
      const isExist = await prisma.returns_01.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedById: null,
          OR: [
            {
              status: "PAID",
              return_type: "REVISED",
            },
            {
              status: "LATE",
              return_type: "REVISED",
            },
            {
              status: "PAID",
              return_type: "ORIGINAL",
            },
            {
              status: "LATE",
              return_type: "ORIGINAL",
            },
          ],
          penalty: payload.penalty,
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
          filing_datetime: new Date(),
          is_quarterly: isExist.dvat04.frequencyFilings == "QUARTERLY",
        },
        include: {
          dvat04: true,
        },
      });
      if (!updateresponse) {
        throw new Error("Something went wrong! Unable to submit");
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

      return updateresponse;
    });

    return createResponse({
      message: "Form submitted completed successfully.",
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

export default AddSubmitPayment;

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
  const toYear = month === "March" ? parseInt(year) + 1 : parseInt(year);
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
