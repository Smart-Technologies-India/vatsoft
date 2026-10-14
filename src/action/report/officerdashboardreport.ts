"use server";
import { getCurrentUserId } from "@/lib/auth";

import { ApiResponseType, createResponse } from "@/models/response";
import { errorToString } from "@/utils/methods";

interface OfficerDashboardPayload {
  selectOffice?: SelectOffice;
  selectCommodity?: "FUEL" | "LIQUOR" | "OIDC" | "MANUFACTURER" | "WHOLESALER" | "RESTAURANT";
  filterType?: "MONTH" | "YEAR";
  month?: number;
  year?: number;
}

import prisma from "../../../prisma/database";
import { SelectOffice } from "@prisma/client";

interface ResponseData {
  totaldealer: number;
  fueldealer: number;
  liquoredealer: number;
  manufacturer: number;
  oidcdealer: number;
  wholesaler: number;
  restaurant: number;
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
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        status: false,
        data: null,
        message: "Not authenticated. Please login.",
        functionname: "OfficerDashboardReport",
      } as any;
    }

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
      whereClause.commodity = "LIQUOR";
    } else if (payload.selectCommodity === "OIDC") {
      whereClause.commodity = "OIDC";
    } else if (payload.selectCommodity === "MANUFACTURER") {
      whereClause.commodity = "MANUFACTURER";
    } else if (payload.selectCommodity === "WHOLESALER") {
      whereClause.commodity = "WHOLESALER";
    } else if (payload.selectCommodity === "RESTAURANT") {
      whereClause.commodity = "RESTAURANT";
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

    const wholesalerWhere: any = {
      deletedAt: null,
      deletedBy: null,
      commodity: "WHOLESALER",
      status: "APPROVED",
    };
    if (payload.selectOffice) {
      wholesalerWhere.selectOffice = payload.selectOffice;
    }

    const wholesaler = await prisma.dvat04.count({
      where: wholesalerWhere,
    });

    const restaurantWhere: any = {
      deletedAt: null,
      deletedBy: null,
      commodity: "RESTAURANT",
      status: "APPROVED",
    };
    if (payload.selectOffice) {
      restaurantWhere.selectOffice = payload.selectOffice;
    }

    const restaurant = await prisma.dvat04.count({
      where: restaurantWhere,
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
      regWhere.commodity = "LIQUOR";
    } else if (payload.selectCommodity === "OIDC") {
      regWhere.commodity = "OIDC";
    } else if (payload.selectCommodity === "MANUFACTURER") {
      regWhere.commodity = "MANUFACTURER";
    } else if (payload.selectCommodity === "WHOLESALER") {
      regWhere.commodity = "WHOLESALER";
    } else if (payload.selectCommodity === "RESTAURANT") {
      regWhere.commodity = "RESTAURANT";
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
      compWhere.commodity = "LIQUOR";
    } else if (payload.selectCommodity === "OIDC") {
      compWhere.commodity = "OIDC";
    } else if (payload.selectCommodity === "MANUFACTURER") {
      compWhere.commodity = "MANUFACTURER";
    } else if (payload.selectCommodity === "WHOLESALER") {
      compWhere.commodity = "WHOLESALER";
    } else if (payload.selectCommodity === "RESTAURANT") {
      compWhere.commodity = "RESTAURANT";
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
      filedReturnDvatWhere.commodity = "LIQUOR";
    } else if (payload.selectCommodity === "OIDC") {
      filedReturnDvatWhere.commodity = "OIDC";
    } else if (payload.selectCommodity === "MANUFACTURER") {
      filedReturnDvatWhere.commodity = "MANUFACTURER";
    } else if (payload.selectCommodity === "WHOLESALER") {
      filedReturnDvatWhere.commodity = "WHOLESALER";
    } else if (payload.selectCommodity === "RESTAURANT") {
      filedReturnDvatWhere.commodity = "RESTAURANT";
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
      pendingReturnDvatWhere.commodity = "LIQUOR";
    } else if (payload.selectCommodity === "OIDC") {
      pendingReturnDvatWhere.commodity = "OIDC";
    } else if (payload.selectCommodity === "MANUFACTURER") {
      pendingReturnDvatWhere.commodity = "MANUFACTURER";
    } else if (payload.selectCommodity === "WHOLESALER") {
      pendingReturnDvatWhere.commodity = "WHOLESALER";
    } else if (payload.selectCommodity === "RESTAURANT") {
      pendingReturnDvatWhere.commodity = "RESTAURANT";
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

    // Build date filters based on filterType
    let firstDayOfThisMonth: Date;
    let firstDayOfNextMonth: Date;
    let firstDayOfLastMonth: Date;
    let lastDayOfLastMonth: Date;
    let startDateLast30Days: Date;
    let endDateLast30Days: Date;

    if (payload.year) {
      if (payload.filterType === "MONTH" && payload.month) {
        // Filter by specific month and year
        firstDayOfThisMonth = new Date(payload.year, payload.month - 1, 1, 0, 0, 0, 0);
        firstDayOfNextMonth = new Date(payload.year, payload.month, 1, 0, 0, 0, 0);
        firstDayOfLastMonth = new Date(payload.year, payload.month - 2, 1, 0, 0, 0, 0);
        lastDayOfLastMonth = new Date(payload.year, payload.month - 1, 0, 23, 59, 59, 999);
        startDateLast30Days = firstDayOfThisMonth;
        endDateLast30Days = new Date(payload.year, payload.month, 0, 23, 59, 59, 999);
      } else {
        // Filter by year only
        firstDayOfThisMonth = new Date(payload.year, 0, 1, 0, 0, 0, 0);
        firstDayOfNextMonth = new Date(payload.year + 1, 0, 1, 0, 0, 0, 0);
        firstDayOfLastMonth = new Date(payload.year - 1, 0, 1, 0, 0, 0, 0);
        lastDayOfLastMonth = new Date(payload.year - 1, 11, 31, 23, 59, 59, 999);
        startDateLast30Days = firstDayOfThisMonth;
        endDateLast30Days = new Date(payload.year, 11, 31, 23, 59, 59, 999);
      }
    } else {
      // Default: current year
      const year = currentDate.getFullYear();
      firstDayOfThisMonth = new Date(year, 0, 1, 0, 0, 0, 0);
      firstDayOfNextMonth = new Date(year + 1, 0, 1, 0, 0, 0, 0);
      firstDayOfLastMonth = new Date(year - 1, 0, 1, 0, 0, 0, 0);
      lastDayOfLastMonth = new Date(year - 1, 11, 31, 23, 59, 59, 999);
      startDateLast30Days = firstDayOfThisMonth;
      endDateLast30Days = new Date(year, 11, 31, 23, 59, 59, 999);
    }
    const lastMonthDvatWhere: any = {};
    if (payload.selectOffice) {
      lastMonthDvatWhere.selectOffice = payload.selectOffice;
    }
    if (payload.selectCommodity === "FUEL") {
      lastMonthDvatWhere.commodity = "FUEL";
    } else if (payload.selectCommodity === "LIQUOR") {
      lastMonthDvatWhere.commodity = "LIQUOR";
    } else if (payload.selectCommodity === "OIDC") {
      lastMonthDvatWhere.commodity = "OIDC";
    } else if (payload.selectCommodity === "MANUFACTURER") {
      lastMonthDvatWhere.commodity = "MANUFACTURER";
    } else if (payload.selectCommodity === "WHOLESALER") {
      lastMonthDvatWhere.commodity = "WHOLESALER";
    } else if (payload.selectCommodity === "RESTAURANT") {
      lastMonthDvatWhere.commodity = "RESTAURANT";
    }

    // Count records received last month
    const last_month_received_data = await prisma.returns_01.findMany({
      where: {
        dvat04: lastMonthDvatWhere,
        deletedAt: null,
        deletedById: null,
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
        last_month_received_data[i].total_tax_amount ?? "0"
      ));
    }

    const thisMonthDvatWhere: any = {};
    if (payload.selectOffice) {
      thisMonthDvatWhere.selectOffice = payload.selectOffice;
    }
    if (payload.selectCommodity === "FUEL") {
      thisMonthDvatWhere.commodity = "FUEL";
    } else if (payload.selectCommodity === "LIQUOR") {
      thisMonthDvatWhere.commodity = "LIQUOR";
    } else if (payload.selectCommodity === "OIDC") {
      thisMonthDvatWhere.commodity = "OIDC";
    } else if (payload.selectCommodity === "MANUFACTURER") {
      thisMonthDvatWhere.commodity = "MANUFACTURER";
    } else if (payload.selectCommodity === "WHOLESALER") {
      thisMonthDvatWhere.commodity = "WHOLESALER";
    } else if (payload.selectCommodity === "RESTAURANT") {
      thisMonthDvatWhere.commodity = "RESTAURANT";
    }

    // Count records received in last 30 days (instead of this month)
    const this_month_received_data = await prisma.returns_01.findMany({
      where: {
        dvat04: thisMonthDvatWhere,
        deletedAt: null,
        deletedById: null,
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
        this_month_received_data[i].total_tax_amount ?? "0"
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
      todayDvatWhere.commodity = "LIQUOR";
    } else if (payload.selectCommodity === "OIDC") {
      todayDvatWhere.commodity = "OIDC";
    } else if (payload.selectCommodity === "MANUFACTURER") {
      todayDvatWhere.commodity = "MANUFACTURER";
    } else if (payload.selectCommodity === "WHOLESALER") {
      todayDvatWhere.commodity = "WHOLESALER";
    } else if (payload.selectCommodity === "RESTAURANT") {
      todayDvatWhere.commodity = "RESTAURANT";
    }

    // Count records received today
    const today_received_data = await prisma.returns_01.findMany({
      where: {
        dvat04: todayDvatWhere,
        deletedAt: null,
        deletedById: null,
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
        today_received_data[i].total_tax_amount ?? "0"
      ));
    }

    const response: ResponseData = {
      totaldealer: Math.max(0, total_dealer),
      fueldealer: Math.max(0, fueldealer),
      liquoredealer: Math.max(0, liquoredealer),
      manufacturer: Math.max(0, manufacturer),
      oidcdealer: Math.max(0, oidcdealer),
      wholesaler: Math.max(0, wholesaler),
      restaurant: Math.max(0, restaurant),
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
