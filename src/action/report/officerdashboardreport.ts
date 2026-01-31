"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";

interface OfficerDashboardPayload {
  selectOffice?: SelectOffice;
  selectCommodity?: "FUEL" | "LIQUOR";
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
const OfficerDashboardReport = async (
  payload: OfficerDashboardPayload
): Promise<ApiResponseType<ResponseData | null>> => {
  const functionname: string = OfficerDashboardReport.name;
  try {
    const whereClause: any = {
      deletedAt: null,
      deletedBy: null,
      status: "APPROVED",
    };

    if (payload.selectOffice) {
      whereClause.selectOffice = payload.selectOffice;
    }

    if (payload.selectCommodity === "FUEL") {
      whereClause.commodity = "FUEL";
    } else if (payload.selectCommodity === "LIQUOR") {
      whereClause.commodity = { not: "FUEL" };
    }

    const total_dealer = await prisma.dvat04.count({
      where: whereClause,
    });

    const fueldealerWhere: any = {
      deletedAt: null,
      deletedBy: null,
      commodity: "FUEL",
      status: "APPROVED",
    };
    if (payload.selectOffice) {
      fueldealerWhere.selectOffice = payload.selectOffice;
    }

    const fueldealer = await prisma.dvat04.count({
      where: fueldealerWhere,
    });

    const liquoredealerWhere: any = {
      deletedAt: null,
      deletedBy: null,
      commodity: "LIQUOR",
      status: "APPROVED",
    };
    if (payload.selectOffice) {
      liquoredealerWhere.selectOffice = payload.selectOffice;
    }

    const liquoredealer = await prisma.dvat04.count({
      where: liquoredealerWhere,
    });
    const manufacturerWhere: any = {
      deletedAt: null,
      deletedBy: null,
      commodity: "MANUFACTURER",
      status: "APPROVED",
    };
    if (payload.selectOffice) {
      manufacturerWhere.selectOffice = payload.selectOffice;
    }

    const manufacturer = await prisma.dvat04.count({
      where: manufacturerWhere,
    });
    const oidcdealerWhere: any = {
      deletedAt: null,
      deletedBy: null,
      commodity: "OIDC",
      status: "APPROVED",
    };
    if (payload.selectOffice) {
      oidcdealerWhere.selectOffice = payload.selectOffice;
    }

    const oidcdealer = await prisma.dvat04.count({
      where: oidcdealerWhere,
    });
    const regWhere: any = {
      deletedAt: null,
      deletedBy: null,
      compositionScheme: false,
      status: "APPROVED",
    };
    if (payload.selectOffice) {
      regWhere.selectOffice = payload.selectOffice;
    }
    if (payload.selectCommodity === "FUEL") {
      regWhere.commodity = "FUEL";
    } else if (payload.selectCommodity === "LIQUOR") {
      regWhere.commodity = { not: "FUEL" };
    }

    const reg = await prisma.dvat04.count({
      where: regWhere,
    });
    const compWhere: any = {
      deletedAt: null,
      deletedBy: null,
      compositionScheme: true,
      status: "APPROVED",
    };
    if (payload.selectOffice) {
      compWhere.selectOffice = payload.selectOffice;
    }
    if (payload.selectCommodity === "FUEL") {
      compWhere.commodity = "FUEL";
    } else if (payload.selectCommodity === "LIQUOR") {
      compWhere.commodity = { not: "FUEL" };
    }

    const comp = await prisma.dvat04.count({
      where: compWhere,
    });
    const filedReturnDvatWhere: any = {};
    if (payload.selectOffice) {
      filedReturnDvatWhere.selectOffice = payload.selectOffice;
    }
    if (payload.selectCommodity === "FUEL") {
      filedReturnDvatWhere.commodity = "FUEL";
    } else if (payload.selectCommodity === "LIQUOR") {
      filedReturnDvatWhere.commodity = { not: "FUEL" };
    }

    const filed_return = await prisma.return_filing.count({
      where: {
        dvat: filedReturnDvatWhere,
        deletedAt: null,
        deletedBy: null,
        NOT: [
          {
            filing_date: null,
          },
        ],
      },
    });

    const pendingReturnDvatWhere: any = {};
    if (payload.selectOffice) {
      pendingReturnDvatWhere.selectOffice = payload.selectOffice;
    }
    if (payload.selectCommodity === "FUEL") {
      pendingReturnDvatWhere.commodity = "FUEL";
    } else if (payload.selectCommodity === "LIQUOR") {
      pendingReturnDvatWhere.commodity = { not: "FUEL" };
    }

    const pending_return = await prisma.return_filing.count({
      where: {
        dvat: pendingReturnDvatWhere,
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

    // Calculate date range for last 30 days
    const endDateLast30Days = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      23,
      59,
      59,
      999
    );
    const startDateLast30Days = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - 30,
      0,
      0,
      0,
      0
    );
    const lastMonthDvatWhere: any = {};
    if (payload.selectOffice) {
      lastMonthDvatWhere.selectOffice = payload.selectOffice;
    }
    if (payload.selectCommodity === "FUEL") {
      lastMonthDvatWhere.commodity = "FUEL";
    } else if (payload.selectCommodity === "LIQUOR") {
      lastMonthDvatWhere.commodity = { not: "FUEL" };
    }

    // Count records received last month
    const last_month_received_data = await prisma.returns_01.findMany({
      where: {
        dvat04: lastMonthDvatWhere,
        deletedAt: null,
        deletedBy: null,
        OR: [
          {
            status: "LATE",
          },
          {
            status: "PAID",
          },
        ],
        transaction_date: {
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth,
        },
      },
    });

    let last_month_received: number = 0;

    for (let i = 0; i < last_month_received_data.length; i++) {
      last_month_received += Math.max(0, parseInt(
        last_month_received_data[i].vatamount ?? "0"
      ));
    }

    const thisMonthDvatWhere: any = {};
    if (payload.selectOffice) {
      thisMonthDvatWhere.selectOffice = payload.selectOffice;
    }
    if (payload.selectCommodity === "FUEL") {
      thisMonthDvatWhere.commodity = "FUEL";
    } else if (payload.selectCommodity === "LIQUOR") {
      thisMonthDvatWhere.commodity = { not: "FUEL" };
    }

    // Count records received in last 30 days (instead of this month)
    const this_month_received_data = await prisma.returns_01.findMany({
      where: {
        dvat04: thisMonthDvatWhere,
        deletedAt: null,
        deletedBy: null,
        OR: [
          {
            status: "LATE",
          },
          {
            status: "PAID",
          },
        ],
        transaction_date: {
          gte: startDateLast30Days,
          lte: endDateLast30Days,
        },
      },
    });

    let this_month_received: number = 0;

    for (let i = 0; i < this_month_received_data.length; i++) {
      this_month_received += Math.max(0, parseInt(
        this_month_received_data[i].vatamount ?? "0"
      ));
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

    const todayDvatWhere: any = {};
    if (payload.selectOffice) {
      todayDvatWhere.selectOffice = payload.selectOffice;
    }
    if (payload.selectCommodity === "FUEL") {
      todayDvatWhere.commodity = "FUEL";
    } else if (payload.selectCommodity === "LIQUOR") {
      todayDvatWhere.commodity = { not: "FUEL" };
    }

    // Count records received today
    const today_received_data = await prisma.returns_01.findMany({
      where: {
        dvat04: todayDvatWhere,
        deletedAt: null,
        deletedBy: null,
        OR: [
          {
            status: "LATE",
          },
          {
            status: "PAID",
          },
        ],
        transaction_date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    let today_received: number = 0;
    for (let i = 0; i < today_received_data.length; i++) {
      today_received += Math.max(0, parseInt(
        today_received_data[i].vatamount ?? "0"
      ));
    }

    const response: ResponseData = {
      totaldealer: Math.max(0, total_dealer),
      fueldealer: Math.max(0, fueldealer),
      liquoredealer: Math.max(0, liquoredealer),
      manufacturer: Math.max(0, manufacturer),
      oidcdealer: Math.max(0, oidcdealer),
      reg: Math.max(0, reg),
      comp: Math.max(0, comp),
      last_month_received: Math.max(0, isNaN(last_month_received) ? 0 : last_month_received),
      this_month_received: Math.max(0, isNaN(this_month_received) ? 0 : this_month_received),
      filed_return: Math.max(0, filed_return),
      pending_return: Math.max(0, pending_return),
      today_received: Math.max(0, today_received),
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

export default OfficerDashboardReport;
