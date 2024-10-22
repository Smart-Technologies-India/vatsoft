"use server";

import {
  capitalcase,
  errorToString,
  getMonthDifference,
  getPreviousMonth,
} from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import prisma from "../../../prisma/database";

interface CheckLastPaymentPayload {
  id: number;
}

const CheckLastPayment = async (
  payload: CheckLastPaymentPayload
): Promise<ApiResponseType<boolean | null>> => {
  const functionname: string = CheckLastPayment.name;
  try {
    let isExist = await prisma.returns_01.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        return_type: "REVISED",
      },
      include: {
        dvat04: true,
      },
    });

    if (!isExist) {
      isExist = await prisma.returns_01.findFirst({
        where: {
          id: payload.id,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          return_type: "ORIGINAL",
        },
        include: {
          dvat04: true,
        },
      });
    }
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

    // Get the month index from the month name
    let monthIndex = monthNames.indexOf(isExist.month!);
    const current_payment_date = new Date(
      parseInt(isExist.year),
      monthIndex,
      1
    );

    const year: string = getPreviousMonth(current_payment_date)
      .getFullYear()
      .toString();
    const month: string = capitalcase(
      getPreviousMonth(current_payment_date).toLocaleString("default", {
        month: "long",
      })
    );
    const userid = isExist.createdById;

    let lastPayment = await prisma.returns_01.findFirst({
      where: {
        deletedAt: null,
        deletedById: null,
        status: "ACTIVE",
        createdById: userid,
        year: year,
        month: month,
        return_type: "REVISED",
      },
    });

    if (!lastPayment) {
      lastPayment = await prisma.returns_01.findFirst({
        where: {
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
          createdById: userid,
          year: year,
          month: month,
          return_type: "ORIGINAL",
        },
      });

      if (isExist.dvat04.vatLiableDate! > current_payment_date) {
        return createResponse({
          data: false,
          message:
            "You are not eligible to pay return for this period.Kindly contact administration.",
          functionname,
        });
      } else {
        const month_dif = getMonthDifference(
          isExist.dvat04.vatLiableDate!,
          current_payment_date
        );

        if (month_dif <= 1) {
          return createResponse({
            data: true,
            message: "Payment completed successfully",
            functionname,
          });
        } else {
          return createResponse({
            data: false,
            message:
              "You have pending returns from previous month.Kindly complete all pending returns before proceeding.",
            functionname,
          });
        }
      }
    }

    if (
      lastPayment.rr_number == null ||
      lastPayment.rr_number == "" ||
      lastPayment.rr_number == undefined
    ) {
      return createResponse({
        data: false,
        message: `You have a pending return for period: ${month} - ${year}. Payment not completed. Kindly file previous return before proceeding.`,
        functionname,
      });
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

export default CheckLastPayment;
