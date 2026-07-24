"use server";
import { getCurrentUserId, getCurrentDvatId } from "@/lib/auth";

import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface CheckPaymentPayload {
  id: number;
}

const CheckPayment = async (
  payload: CheckPaymentPayload,
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = CheckPayment.name;
  try {
    const currentUserId = await getCurrentUserId();
    const currentDvatId = await getCurrentDvatId();
    if (!currentUserId || !currentDvatId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "CheckPayment",
      } as any;
    }

    const isExist = await prisma.returns_01.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
        // status: "PAID",
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

    // Check if this is quarterly filing
    const isQuarterlyFiling =
      isExist.dvat04.frequencyFilings?.toUpperCase() === "QUARTERLY";

    if (isQuarterlyFiling) {
      // For quarterly filings, verify that payment is for the last month of quarter
      const quarterLastMonthMap: { [key: string]: string } = {
        January: "March",
        February: "March",
        March: "March",
        April: "June",
        May: "June",
        June: "June",
        July: "September",
        August: "September",
        September: "September",
        October: "December",
        November: "December",
        December: "December",
      };

      const lastMonthOfQuarter = quarterLastMonthMap[isExist.month!];

      // // If current month is not the last month of quarter, check the last month's payment
      // if (isExist.month !== lastMonthOfQuarter) {
      //   return createResponse({
      //     data: false,
      //     message:
      //       "Payment should be made in the last month of the quarter. Please check the last month payment.",
      //     functionname,
      //   });
      // }

      const lastMonthPayment = await prisma.returns_01.findFirst({
        where: {
          dvat04Id: isExist.dvat04Id,
          year: isExist.year,
          month: lastMonthOfQuarter,
          return_type: isExist.return_type,
        },
      });

      if (!lastMonthPayment) {
        return createResponse({
          data: false,
          message: "Payment not completed yet.",
          functionname,
        });
      }

      if (
        (lastMonthPayment.rr_number == null ||
          lastMonthPayment.rr_number == "" ||
          lastMonthPayment.rr_number == undefined) &&
        lastMonthPayment.status !== "PAID"
      ) {
        return createResponse({
          data: false,
          message: "Payment not completed yet.",
          functionname,
        });
      }
    } else {
      if (
        (isExist.rr_number == null ||
          isExist.rr_number == "" ||
          isExist.rr_number == undefined) &&
        isExist.status !== "PAID"
      ) {
        return createResponse({
          data: false,
          message: "Payment not completed yet.",
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

export default CheckPayment;
