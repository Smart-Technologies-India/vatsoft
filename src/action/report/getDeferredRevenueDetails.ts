"use server";

import prisma from "../../../prisma/database";
import { SelectOffice } from "@prisma/client";

export interface ChallanDetailRecord {
  type: "challan";
  id: number;
  amount: string;
  transaction_date: string;
  order_id: string | null;
  paymentmode: string | null;
  bank_name: string | null;
  status_message: string | null;
  dealerName: string | null;
  dealerTIN: string | null;
  dealerOffice: string | null;
  frequencyFilings: string | null;
}

export interface ReturnDetailRecord {
  type: "return";
  id: number;
  amount: string;
  transaction_date: string;
  month: string | null;
  year: string;
  return_type: string;
  status: string;
  dealerName: string | null;
  dealerTIN: string | null;
  dealerOffice: string | null;
  frequencyFilings: string | null;
}

export type DetailRecord = ChallanDetailRecord | ReturnDetailRecord;

export default async function getDeferredRevenueDetails(params: {
  transactionMonth: string;
  forMonth: string;
  selectOffice?: SelectOffice;
}) {
  try {
    const { transactionMonth, forMonth, selectOffice } = params;

    // Create date range for transaction month
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

    const monthNum = monthMap[transactionMonth];
    if (monthNum === undefined) {
      return {
        status: false,
        message: "Invalid transaction month",
        data: null,
      };
    }

    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, monthNum, 1);
    const endDate = new Date(currentYear, monthNum + 1, 1);

    // Build challan query
    const challanWhere: any = {
      paymentstatus: "PAID",
      transaction_date: {
        gte: startDate,
        lt: endDate,
      },
    };

    if (selectOffice) {
      challanWhere.dvat = {
        selectOffice,
      };
    }

    // Get all challans for this transaction month
    const challans = await prisma.challan.findMany({
      where: challanWhere,
      include: {
        returns_01: {
          select: {
            month: true,
          },
        },
        dvat: {
          select: {
            id: true,
            tradename: true,
            tinNumber: true,
            selectOffice: true,
            frequencyFilings: true,
          },
        },
      },
      orderBy: {
        transaction_date: "desc",
      },
    });

    // Filter challans by forMonth
    const filteredChallans = challans.filter((challan) => {
      if (challan.returns_01 && challan.returns_01.month) {
        return challan.returns_01.month === forMonth;
      }
      // If no return linked, include if forMonth equals transactionMonth
      return transactionMonth === forMonth;
    });

    // Build return query
    const returnsWhere: any = {
      month: forMonth,
      transaction_date: {
        gte: startDate,
        lt: endDate,
      },
    };

    if (selectOffice) {
      returnsWhere.dvat04 = {
        selectOffice,
      };
    }

    // Get all returns for this transaction month and for month
    const returns = await prisma.returns_01.findMany({
      where: returnsWhere,
      include: {
        dvat04: {
          select: {
            id: true,
            tradename: true,
            tinNumber: true,
            selectOffice: true,
            frequencyFilings: true,
          },
        },
      },
      orderBy: {
        transaction_date: "desc",
      },
    });

    // Format challan records
    const challanRecords: ChallanDetailRecord[] = filteredChallans.map(
      (challan) => ({
        type: "challan" as const,
        id: challan.id,
        amount: challan.total_tax_amount || "0",
        transaction_date: challan.transaction_date
          ? new Date(challan.transaction_date).toISOString().split("T")[0]
          : "",
        order_id: challan.order_id,
        paymentmode: challan.paymentmode,
        bank_name: challan.bank_name,
        status_message: challan.status_message,
        dealerName: challan.dvat?.tradename || null,
        dealerTIN: challan.dvat?.tinNumber || null,
        dealerOffice: challan.dvat?.selectOffice || null,
        frequencyFilings: challan.dvat?.frequencyFilings || null,
      }),
    );

    // Format return records
    const returnRecords: ReturnDetailRecord[] = returns.map((ret) => ({
      type: "return" as const,
      id: ret.id,
      amount: ret.total_tax_amount || "0",
      transaction_date: ret.transaction_date
        ? new Date(ret.transaction_date).toISOString().split("T")[0]
        : "Not Paid",
      month: ret.month,
      year: ret.year,
      return_type: ret.return_type,
      status: ret.status,
      dealerName: ret.dvat04?.tradename || null,
      dealerTIN: ret.dvat04?.tinNumber || null,
      dealerOffice: ret.dvat04?.selectOffice || null,
      frequencyFilings: ret.dvat04?.frequencyFilings || null,
    }));

    // Combine and sort - only include challans in allRecords
    const allRecords: DetailRecord[] = challanRecords.sort((a, b) => {
      const dateA = new Date(a.transaction_date).getTime();
      const dateB = new Date(b.transaction_date).getTime();
      return dateB - dateA;
    });

    // Calculate totals
    const challanTotal = challanRecords.reduce(
      (sum, c) => sum + parseFloat(c.amount || "0"),
      0,
    );
    const returnTotal = returnRecords.reduce(
      (sum, r) => sum + parseFloat(r.amount || "0"),
      0,
    );

    return {
      status: true,
      message: "Details fetched successfully",
      data: {
        transactionMonth,
        forMonth,
        challans: challanRecords,
        returns: returnRecords,
        allRecords,
        summary: {
          totalChallans: challanRecords.length,
          challanAmount: challanTotal,
          totalReturns: returnRecords.length,
          returnAmount: returnTotal,
          grandTotal: challanTotal + returnTotal,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching deferred revenue details:", error);
    return {
      status: false,
      message: "Failed to fetch details",
      data: null,
    };
  }
}
