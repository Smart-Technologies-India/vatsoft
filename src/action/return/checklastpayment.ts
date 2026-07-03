"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { capitalcase, errorToString, getPreviousMonth } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface CheckLastPaymentPayload {
  id: number;
}

const CheckLastPayment = async (
  payload: CheckLastPaymentPayload,
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = CheckLastPayment.name;
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "CheckLastPayment",
      } as any;
    }

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
      return createResponse({ message: "Invalid Id, try again", functionname });
    }

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

    // Check if this is quarterly filing
    const isQuarterlyFiling =
      isExist.dvat04.frequencyFilings?.toUpperCase() === "QUARTERLY";

    if (isQuarterlyFiling) {
      // Handle quarterly filing - check for previous quarter payments
      const result = await checkQuarterlyPayments(
        isExist,
        currentDvatId,
        monthNames,
      );
      if (!result.success) {
        return createResponse({
          data: false,
          message: result.message,
          functionname,
        });
      }
    } else {
      // Handle monthly filing (existing logic)
      // Get the month index from the month name
      let monthIndex = monthNames.indexOf(isExist.month!);

      const current_payment_date = new Date(
        Date.UTC(parseInt(isExist.year), monthIndex, 1),
      );

      const year: string = getPreviousMonth(current_payment_date)
        .getFullYear()
        .toString();
      const month: string = capitalcase(
        getPreviousMonth(current_payment_date).toLocaleString("default", {
          month: "long",
        }),
      );

      const lastmonthindex = monthNames.indexOf(month);
      const lastmonthdate = new Date(
        Date.UTC(parseInt(year), lastmonthindex, 1),
      );

      if (isExist.dvat04.vatLiableDate! > current_payment_date) {
        return createResponse({
          data: false,
          message:
            "You are not eligible to pay return for this period. Kindly contact administration.",
          functionname,
        });
      }

      let lastPayment = await prisma.returns_01.findFirst({
        where: {
          deletedAt: null,
          deletedById: null,
          dvat04Id: currentDvatId,
          year: year,
          month: month,
          OR: [
            {
              return_type: "ORIGINAL",
              status: "PAID",
            },
            {
              return_type: "ORIGINAL",
              status: "LATE",
            },
            {
              return_type: "REVISED",
              status: "PAID",
            },
            {
              return_type: "REVISED",
              status: "LATE",
            },
          ],
        },
      });

      if (!lastPayment) {
        if (isExist.dvat04.vatLiableDate!.getTime() != lastmonthdate.getTime()) {
          if (isExist.dvat04.vatLiableDate! > lastmonthdate) {
          } else {
            console.log("lastPayment", lastPayment);
            console.log(
              "isExist.dvat04.vatLiableDate",
              isExist.dvat04.vatLiableDate,
            );
            console.log("lastmonthdate", lastmonthdate);
            return createResponse({
              data: false,
              message: `You have a pending return for period: ${month} - ${year}. Payment not completed. Kindly file previous return before proceeding.`,
              functionname,
            });
          }
        }
      }

      if (
        lastPayment &&
        (lastPayment.rr_number == null ||
          lastPayment.rr_number == "" ||
          lastPayment.rr_number == undefined)
      ) {
        return createResponse({
          data: false,
          message: `You have a pending return for period: ${month} - ${year}. Payment not completed. Kindly file previous return before proceeding.`,
          functionname,
        });
      }
    }

    return createResponse({
      message: "Payment completed successfully.",
      functionname,
      data: true,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

// Helper function to get quarter months
function getQuarterMonths(month: string): string[] {
  const quarterMonths: Record<string, string[]> = {
    "April": ["April", "May", "June"],
    "May": ["April", "May", "June"],
    "June": ["April", "May", "June"],
    "July": ["July", "August", "September"],
    "August": ["July", "August", "September"],
    "September": ["July", "August", "September"],
    "October": ["October", "November", "December"],
    "November": ["October", "November", "December"],
    "December": ["October", "November", "December"],
    "January": ["January", "February", "March"],
    "February": ["January", "February", "March"],
    "March": ["January", "February", "March"],
  };

  return quarterMonths[month] || [];
}

// Helper function to get previous quarter months
function getPreviousQuarterMonths(month: string): string[] {
  const previousQuarterMap: Record<string, string[]> = {
    "April": ["January", "February", "March"], // Q1 -> Q4
    "May": ["January", "February", "March"],
    "June": ["January", "February", "March"],
    "July": ["April", "May", "June"], // Q2 -> Q1
    "August": ["April", "May", "June"],
    "September": ["April", "May", "June"],
    "October": ["July", "August", "September"], // Q3 -> Q2
    "November": ["July", "August", "September"],
    "December": ["July", "August", "September"],
    "January": ["October", "November", "December"], // Q4 -> Q3
    "February": ["October", "November", "December"],
    "March": ["October", "November", "December"],
  };

  return previousQuarterMap[month] || [];
}

// Helper function to get year for a given month (Financial Year aware)
function getYearForQuarterMonth(
  baseYear: string,
  month: string,
  currentMonth: string,
): string {
  // If current month is in Q4 (Jan-Mar), it belongs to next calendar year but same FY
  // If previous quarter month is in Q4 and current is in Q1, need to decrement year
  const currentQuarterMonths = getQuarterMonths(currentMonth);
  const isCurrentInQ4 = ["January", "February", "March"].includes(currentMonth);
  const isMonthInQ4 = ["January", "February", "March"].includes(month);

  // If current is Q1 (Apr-Jun) and checking Q4 (Jan-Mar) of previous quarter
  if (
    ["April", "May", "June"].includes(currentMonth) &&
    isMonthInQ4
  ) {
    return (parseInt(baseYear) - 1).toString();
  }

  // Q4 current (Jan-Mar) checks Q3 (Oct-Dec) of same calendar year
  // This maintains the same year as provided

  return baseYear;
}

// Helper function to check quarterly payments
async function checkQuarterlyPayments(
  isExist: any,
  currentDvatId: number,
  monthNames: string[],
): Promise<{ success: boolean; message: string }> {
  const previousQuarterMonths = getPreviousQuarterMonths(isExist.month!);

  if (previousQuarterMonths.length === 0) {
    return {
      success: true,
      message: "Valid quarterly filing",
    };
  }

  // For quarterly, check if all 3 months of previous quarter have payments
  const lastMonthOfPrevQuarter =
    previousQuarterMonths[previousQuarterMonths.length - 1];

  // Get the correct year for the previous quarter month (Financial Year aware)
  const yearForPrevQuarter = getYearForQuarterMonth(
    isExist.year,
    lastMonthOfPrevQuarter,
    isExist.month!,
  );

  // Check VAT liable date
  let monthIndex = monthNames.indexOf(isExist.month!);
  const current_payment_date = new Date(
    Date.UTC(parseInt(isExist.year), monthIndex, 1),
  );

  if (isExist.dvat04.vatLiableDate! > current_payment_date) {
    return {
      success: false,
      message:
        "You are not eligible to pay return for this period. Kindly contact administration.",
    };
  }

  // Check if payments exist for all months of previous quarter
  for (const prevMonth of previousQuarterMonths) {
    const yearForMonth = getYearForQuarterMonth(
      isExist.year,
      prevMonth,
      isExist.month!,
    );

    let lastPayment = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        dvat04Id: currentDvatId,
        year: yearForMonth,
        month: prevMonth,
        OR: [
          {
            return_type: "ORIGINAL",
            status: "PAID",
          },
          {
            return_type: "ORIGINAL",
            status: "LATE",
          },
          {
            return_type: "REVISED",
            status: "PAID",
          },
          {
            return_type: "REVISED",
            status: "LATE",
          },
        ],
      },
    });

    if (!lastPayment) {
      // Check if VAT liable date is before or equal to this month
      const monthIndex = monthNames.indexOf(prevMonth);
      const checkDate = new Date(Date.UTC(parseInt(yearForMonth), monthIndex, 1));

      if (isExist.dvat04.vatLiableDate! <= checkDate) {
        return {
          success: false,
          message: `You have a pending return for period: ${prevMonth} - ${yearForMonth}. Payment not completed. Kindly file all quarters before proceeding.`,
        };
      }
    } else if (
      lastPayment.rr_number == null ||
      lastPayment.rr_number == "" ||
      lastPayment.rr_number == undefined
    ) {
      return {
        success: false,
        message: `You have a pending return for period: ${prevMonth} - ${yearForMonth}. Payment not completed. Kindly file all quarters before proceeding.`,
      };
    }
  }

  return {
    success: true,
    message: "All quarterly payments completed",
  };
}

export default CheckLastPayment;
