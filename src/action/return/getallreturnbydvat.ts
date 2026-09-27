"use server";

import { getCurrentUserId } from "@/lib/auth";
import prisma from "../../../prisma/database";
import { errorToString } from "@/utils/methods";
import { ApiResponseType, createResponse } from "@/models/response";
import { returns_01 } from "@prisma/client";
import { CentralSalesCalculation } from "@/components/dvatreturn/vatcalculation";
import getPdfReturn from "./getpdfreturn";

interface GetAllReturnByDvatPayload {
  dvatid: number;
}

interface ReturnDataType extends returns_01 {
  dvat04: {
    id: number;
    tinNumber: string | null;
    tradename: string | null;
    name: string | null;
    compositionScheme: boolean | null;
    frequencyFilings: string;
  };
  gto_amount: string;
}

const GetAllReturnByDvat = async (
  payload: GetAllReturnByDvatPayload,
): Promise<
  ApiResponseType<{
    returns: ReturnDataType[];
    summary: {
      totalReturns: number;
      totalVat: number;
      totalGross: number;
      paidReturns: number;
      pendingReturns: number;
    };
  } | null>
> => {
  const functionname: string = GetAllReturnByDvat.name;

  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname,
      } as any;
    }

    // Verify dvat04 exists
    const dvatExists = await prisma.dvat04.findFirst({
      where: {
        id: payload.dvatid,
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!dvatExists) {
      return createResponse({
        message: "Invalid DVAT ID. Please try again.",
        functionname,
      });
    }

    // Fetch all returns for this dvat04
    const returns = await prisma.returns_01.findMany({
      where: {
        dvat04Id: payload.dvatid,
        deletedAt: null,
        deletedById: null,
        status: "PAID",
      },
      include: {
        returns_entry: true,
        challans: true,
        dvat04: {
          select: {
            id: true,
            tinNumber: true,
            tradename: true,
            name: true,
            compositionScheme: true,
            frequencyFilings: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    // Calculate summary statistics
    let totalVat = 0;
    let totalGross = 0;
    let paidReturns = 0;
    let pendingReturns = 0;

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

    const returnsWithGross = await Promise.all(
      returns.map(async (ret) => {
        const currentMonthIndex = monthNames.indexOf(ret.month || "January");

        const lastMonthIndex = (currentMonthIndex - 1 + 12) % 12;

        // Get the last month's name
        const lastMonth: string = monthNames[lastMonthIndex];

        const lastmonthdata = await getPdfReturn({
          year:
            ret.month == "January"
              ? (parseInt(ret.year) - 1).toString()
              : ret.year,
          month: lastMonth,
        });

        const centralSales = new CentralSalesCalculation(
          ret.returns_entry,
          ret.challans,
          ret,
          parseFloat(lastmonthdata?.data?.returns_01?.pending_payment ?? "0"),
          parseFloat(lastmonthdata?.data?.returns_01?.cash_payment ?? "0"),
          ret.compositionScheme || false,
        );

        const vat = parseFloat(ret.vatamount || "0");
        const grossAmount = centralSales.gross_amount();

        totalVat += vat;
        totalGross += grossAmount;

        if (ret.status === "PAID") {
          paidReturns += 1;
        } else if (ret.status === "DUE" || ret.status === "INACTIVE") {
          pendingReturns += 1;
        }

        return {
          ...ret,
          gto_amount: grossAmount.toString(),
        };
      }),
    );

    return createResponse({
      message: "Return data retrieved successfully",
      functionname,
      data: {
        returns: returnsWithGross,
        summary: {
          totalReturns: returns.length,
          totalVat: totalVat,
          totalGross: totalGross,
          paidReturns: paidReturns,
          pendingReturns: pendingReturns,
        },
      },
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default GetAllReturnByDvat;
