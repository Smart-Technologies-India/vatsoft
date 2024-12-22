"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";

interface OfficerDashboardPayload {
  selectOffice: SelectOffice;
}

import prisma from "../../../prisma/database";
import { SelectOffice } from "@prisma/client";

interface ResponseData {
  totaldealer: number;
  fueldealer: number;
  liquoredealer: number;
  manufacturer: number;
  oidcdealer: number;
  reg: number;
  comp: number;
  last_month_received: number;
  this_month_received: number;
  filed_return: number;
  pending_return: number;
  today_received: number;
}
const OfficerDashboard = async (
  payload: OfficerDashboardPayload
): Promise<ApiResponseType<ResponseData | null>> => {
  const functionname: string = OfficerDashboard.name;
  try {
    const total_dealer = await prisma.dvat04.count({
      where: {
        selectOffice: payload.selectOffice,
        deletedAt: null,
        deletedBy: null,
        status: "APPROVED",
      },
    });

    const fueldealer = await prisma.dvat04.count({
      where: {
        selectOffice: payload.selectOffice,

        deletedAt: null,
        deletedBy: null,
        commodity: "FUEL",
        status: "APPROVED",
      },
    });

    const liquoredealer = await prisma.dvat04.count({
      where: {
        selectOffice: payload.selectOffice,
        deletedAt: null,
        deletedBy: null,
        commodity: "LIQUOR",
        status: "APPROVED",
      },
    });
    const manufacturer = await prisma.dvat04.count({
      where: {
        selectOffice: payload.selectOffice,
        deletedAt: null,
        deletedBy: null,
        commodity: "MANUFACTURER",
        status: "APPROVED",
      },
    });
    const oidcdealer = await prisma.dvat04.count({
      where: {
        selectOffice: payload.selectOffice,
        deletedAt: null,
        deletedBy: null,
        commodity: "OIDC",
        status: "APPROVED",
      },
    });
    const reg = await prisma.dvat04.count({
      where: {
        selectOffice: payload.selectOffice,
        deletedAt: null,
        deletedBy: null,
        compositionScheme: false,
        status: "APPROVED",
      },
    });
    const comp = await prisma.dvat04.count({
      where: {
        selectOffice: payload.selectOffice,
        deletedAt: null,
        deletedBy: null,
        compositionScheme: true,
        status: "APPROVED",
      },
    });
    const filed_return = await prisma.return_filing.count({
      where: {
        dvat: {
          selectOffice: payload.selectOffice,
        },
        deletedAt: null,
        deletedBy: null,
        NOT: [
          {
            filing_date: null,
          },
        ],
      },
    });

    const pending_return = await prisma.return_filing.count({
      where: {
        dvat: {
          selectOffice: payload.selectOffice,
        },
        deletedAt: null,
        deletedBy: null,
        filing_date: null,
      },
    });

    const currentDate = new Date();

    // Get the first day of the current month
    const firstDayOfThisMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    // Get the first day of the next month
    const firstDayOfNextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );

    // Get the first day of the previous month
    const firstDayOfLastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    // Get the last day of the previous month
    const lastDayOfLastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    );
    // Count records received last month
    const last_month_received_data = await prisma.returns_01.findMany({
      where: {
        dvat04: {
          selectOffice: payload.selectOffice,
        },
        deletedAt: null,
        deletedBy: null,
        status: "ACTIVE",
        transaction_date: {
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth,
        },
      },
    });

    let last_month_received: number = 0;

    for (let i = 0; i < last_month_received_data.length; i++) {
      last_month_received += parseInt(
        last_month_received_data[i].total_tax_amount ?? "0"
      );
    }

    // Count records received this month
    const this_month_received_data = await prisma.returns_01.findMany({
      where: {
        dvat04: {
          selectOffice: payload.selectOffice,
        },
        deletedAt: null,
        deletedBy: null,
        status: "ACTIVE",
        transaction_date: {
          gte: firstDayOfThisMonth,
          lt: firstDayOfNextMonth,
        },
      },
    });

    let this_month_received: number = 0;

    for (let i = 0; i < this_month_received_data.length; i++) {
      this_month_received += parseInt(
        this_month_received_data[i].total_tax_amount ?? "0"
      );
    }

    // Get today's start (beginning of the day)
    const startOfToday = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      0,
      0,
      0,
      0
    );

    // Get today's end (end of the day)
    const endOfToday = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      23,
      59,
      59,
      999
    );

    // Count records received today
    const today_received_data = await prisma.returns_01.findMany({
      where: {
        dvat04: {
          selectOffice: payload.selectOffice,
        },
        deletedAt: null,
        deletedBy: null,
        status: "ACTIVE",
        transaction_date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    let today_received: number = 0;
    for (let i = 0; i < today_received_data.length; i++) {
      today_received += parseInt(
        today_received_data[i].total_tax_amount ?? "0"
      );
    }

    const response: ResponseData = {
      totaldealer: total_dealer,
      fueldealer: fueldealer,
      liquoredealer: liquoredealer,
      manufacturer: manufacturer,
      oidcdealer: oidcdealer,
      reg: reg,
      comp: comp,
      last_month_received: isNaN(last_month_received) ? 0 : last_month_received,
      this_month_received: isNaN(this_month_received) ? 0 : this_month_received,
      filed_return: filed_return,
      pending_return: pending_return,
      today_received: today_received,
    };

    return createResponse({
      functionname: functionname,
      message: "Officer Dashboard data.",
      data: response,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export default OfficerDashboard;
