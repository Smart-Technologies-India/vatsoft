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
      Date.UTC(parseInt(isExist.year), monthIndex, 1)
    );

    const year: string = getPreviousMonth(current_payment_date)
      .getFullYear()
      .toString();
    const month: string = capitalcase(
      getPreviousMonth(current_payment_date).toLocaleString("default", {
        month: "long",
      })
    );

    const lastmonthindex = monthNames.indexOf(month);
    const lastmonthdate = new Date(Date.UTC(parseInt(year), lastmonthindex, 1));

    console.log("current_payment_date", current_payment_date);
    console.log("lastmonthdate", lastmonthdate);
    console.log("vatLiableDate", isExist.dvat04.vatLiableDate);

    // console.log("lastmonthdate", lastmonthdate);

    const userid = isExist.createdById;

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
        status: "ACTIVE",
        createdById: userid,
        year: year,
        month: month,
        OR: [
          {
            return_type: "ORIGINAL",
          },
          {
            return_type: "REVISED",
          },
        ],
      },
    });


    if (!lastPayment) {
      if (isExist.dvat04.vatLiableDate! > lastmonthdate) {
      } else {
        return createResponse({
          data: false,
          message: `You have a pending return for period: ${month} - ${year}. Payment not completed. Kindly file previous return before proceeding.`,
          functionname,
        });
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

    // if (isExist.dvat04.vatLiableDate! > lastmonthdate) {
    //   return createResponse({
    //     data: false,
    //     message:
    //       "You are not eligible to pay return for this period. Kindly contact administration.",
    //     functionname,
    //   });
    // } else {
    //   const getlastmonth = await prisma.returns_01.findFirst({
    //     where: {
    //       deletedAt: null,
    //       deletedById: null,
    //       status: "ACTIVE",
    //       createdById: userid,
    //       year: year,
    //       month: month,
    //       OR: [
    //         {
    //           return_type: "ORIGINAL",
    //         },
    //         {
    //           return_type: "REVISED",
    //         },
    //       ],
    //     },
    //   });

    //   if (!getlastmonth) {
    //     return createResponse({
    //       data: false,
    //       message: `You have a pending return for period: ${month} - ${year}. Payment not completed. Kindly file previous return before proceeding.`,
    //       functionname,
    //     });
    //   }
    // }

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
