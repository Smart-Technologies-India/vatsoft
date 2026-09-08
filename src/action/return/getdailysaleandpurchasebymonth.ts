"use server";

import prisma from "../../../prisma/database";

interface DailySaleAndPurchaseResponse {
  status: boolean;
  message: string;
  data?: {
    daily_sale: any[];
    daily_purchase: any[];
    dvat04: any;
  };
}

const getDailySaleAndPurchaseByMonth = async ({
  dvatid,
  month,
  year,
}: {
  dvatid: number;
  month: string;
  year: string;
}): Promise<DailySaleAndPurchaseResponse> => {
  try {
    const dvat04 = await prisma.dvat04.findUnique({
      where: { id: dvatid },
    });

    if (!dvat04) {
      return {
        status: false,
        message: "DVAT04 record not found",
      };
    }

    // Parse month and year
    const monthMap: { [key: string]: number } = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };

    const monthIndex = monthMap[month];
    if (monthIndex === undefined) {
      return {
        status: false,
        message: "Invalid month provided",
      };
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum)) {
      return {
        status: false,
        message: "Invalid year provided",
      };
    }

    // Create date range for the month
    const startDate = new Date(yearNum, monthIndex, 1);
    const endDate = new Date(yearNum, monthIndex + 1, 0, 23, 59, 59);

    // Fetch daily_sale records for specific month and year
    const daily_sale = await prisma.daily_sale.findMany({
      where: {
        dvat04Id: dvatid,
        status: "ACTIVE",
        invoice_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        seller_tin_number: true,
        commodity_master: true,
      },
      orderBy: {
        invoice_date: "asc",
      },
    });

    // Fetch daily_purchase records for specific month and year
    const daily_purchase = await prisma.daily_purchase.findMany({
      where: {
        dvat04Id: dvatid,
        status: "ACTIVE",
        invoice_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        seller_tin_number: true,
        commodity_master: true,
      },
      orderBy: {
        invoice_date: "asc",
      },
    });

    return {
      status: true,
      message: "Data fetched successfully",
      data: {
        daily_sale,
        daily_purchase,
        dvat04,
      },
    };
  } catch (error: any) {
    console.error("Error fetching daily sale and purchase:", error);
    return {
      status: false,
      message: error.message || "Error fetching data",
    };
  }
};

export default getDailySaleAndPurchaseByMonth;
