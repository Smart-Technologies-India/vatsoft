"use server";

import prisma from "../../../prisma/database";
import { DvatType } from "@prisma/client";

export interface ReturnsData {
  returnPeriod: string;
  entryCount: number;
  challanCount: number;
  vatamount: string | number;
  outputTax: number;
  inputCredit: number;
  netTax: number;
  interest: number;
  penalty: number;
  challanPaid: number;
  cashCarryForward: number;
  itcCarryForward: number;
  id: number;
  year: string;
  month: string | null;
  totalTaxAmount: string | null;
}

// Helper function to calculate output tax (R4.8)
async function calculateOutputTax(
  returns_entryRecords: any[],
): Promise<number> {
  const dvat31Entries = returns_entryRecords.filter(
    (entry) => entry.dvat_type === DvatType.DVAT_31,
  );

  const outputTax = dvat31Entries.reduce((sum, entry) => {
    const tax = parseFloat(entry.vatamount || "0");
    return sum + (isNaN(tax) ? 0 : tax);
  }, 0);

  return outputTax;
}

// Helper function to calculate input credit (R5.4)
async function calculateInputCredit(
  returns_entryRecords: any[],
): Promise<number> {
  const dvat30Entries = returns_entryRecords.filter(
    (entry) => entry.dvat_type === DvatType.DVAT_30,
  );

  const inputCredit = dvat30Entries.reduce((sum, entry) => {
    const tax = parseFloat(entry.vatamount || "0");
    return sum + (isNaN(tax) ? 0 : tax);
  }, 0);

  return inputCredit;
}

// Helper function to calculate interest due date
function getInterestDueDate(
  year: string,
  month: string,
  isComp: boolean = false,
): Date {
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

  let monthIndex = monthNames.indexOf(month);
  let computedYear = parseInt(year);

  if (isComp) {
    if (["January", "February", "March"].includes(month)) {
      monthIndex = 3;
    } else if (["April", "May", "June"].includes(month)) {
      monthIndex = 6;
    } else if (["July", "August", "September"].includes(month)) {
      monthIndex = 9;
    } else {
      monthIndex = 0;
      computedYear += 1;
    }
  } else {
    if (monthIndex === 11) {
      computedYear += 1;
      monthIndex = 0;
    } else {
      monthIndex += 1;
    }
  }

  return new Date(computedYear, monthIndex, 15);
}

// Helper function to calculate interest with payments
function calculateInterestWithPayments(
  totalDue: number,
  dueDate: Date,
  payments: Array<{ amount: number; date: Date }>,
  annualRate: number = 15,
  asOfDate: Date = new Date(),
): number {
  if (!Number.isFinite(totalDue) || totalDue <= 0) return 0;

  const dayMs = 24 * 60 * 60 * 1000;

  const normalizeDate = (dateInput: Date | string): Date => {
    const date = new Date(dateInput);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const getDaysDiff = (fromDate: Date, toDate: Date): number => {
    const startUtc = Date.UTC(
      fromDate.getFullYear(),
      fromDate.getMonth(),
      fromDate.getDate(),
    );
    const endUtc = Date.UTC(
      toDate.getFullYear(),
      toDate.getMonth(),
      toDate.getDate(),
    );
    const diff = Math.floor((endUtc - startUtc) / dayMs);
    return Math.max(0, diff);
  };

  const sortedPayments = payments.sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const effectiveAsOfDate = normalizeDate(asOfDate);
  let outstanding = totalDue;
  let anchorDate = normalizeDate(dueDate);
  let interest = 0;

  for (let i = 0; i < sortedPayments.length; i++) {
    const payment = sortedPayments[i];
    if (payment.date > effectiveAsOfDate) {
      break;
    }

    if (payment.date <= anchorDate) {
      outstanding = Math.max(0, outstanding - payment.amount);

      if (outstanding <= 0) {
        break;
      }
      continue;
    }

    if (payment.date > anchorDate && outstanding > 0) {
      const days = getDaysDiff(anchorDate, payment.date);
      const intervalInterest = (outstanding * annualRate * days) / (100 * 365);
      interest += intervalInterest;
    }

    outstanding = Math.max(0, outstanding - payment.amount);
    anchorDate = payment.date;

    if (outstanding <= 0) {
      break;
    }
  }

  if (outstanding > 0 && effectiveAsOfDate > anchorDate) {
    const days = getDaysDiff(anchorDate, effectiveAsOfDate);
    const finalInterest = (outstanding * annualRate * days) / (100 * 365);
    interest += finalInterest;
  }

  return interest;
}

// Helper function to calculate interest (R6.2a)
function calculateInterest(netTax: number, filingDate: Date): number {
  const dueDate = new Date(filingDate);
  dueDate.setDate(dueDate.getDate() + 15); // 15-day grace period

  const currentDate = new Date();
  if (currentDate <= dueDate) {
    return 0;
  }

  const daysDifference = Math.floor(
    (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const interest = (netTax * daysDifference * 1.5) / 100;
  return Math.max(0, interest);
}

// Helper function to get days between dates
function getDaysBetweenDates(startDate: Date, endDate: Date): number {
  const differenceInTime = endDate.getTime() - startDate.getTime();
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);
  return Math.ceil(differenceInDays);
}

// Helper function to calculate penalty (R6.2b) - same as lateFees
function calculatePenalty(
  year: string,
  month: string,
  rrNumber: string | null,
  transactionDate: Date | null,
): number {
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

  let monthIndex = monthNames.indexOf(month);
  let newYear = parseInt(year);

  // Calculate next month (29th is the due date)
  if (monthIndex === 11) {
    newYear += 1;
    monthIndex = 0;
  } else {
    monthIndex += 1;
  }

  const dueDate = new Date(newYear, monthIndex, 29);
  const comparisonDate =
    rrNumber && transactionDate ? new Date(transactionDate) : new Date();

  let pdiff_days = getDaysBetweenDates(dueDate, comparisonDate);
  return Math.min(100 * pdiff_days, 10000);
}

// Helper function to check if value is negative
function isNegative(value: number): boolean {
  return value < 0;
}

// Helper function to calculate R9.1 - Adjusted against liability (adjustAmount)
function calculateAdjustAmount(
  netTax: number,
  returns_entryRecords: any[],
): number {
  const amount = isNegative(netTax) ? Math.abs(netTax) : 0;

  const taxPercentages = ["0", "1", "2", "4", "5", "6", "12.5", "12.75", "13.5", "15", "20"];
  let total = 0;

  // Calculate decrease values for each tax percentage
  for (const percentage of taxPercentages) {
    const entries = returns_entryRecords.filter(
      (entry: any) =>
        entry.dvat_type === DvatType.DVAT_31_A &&
        entry.category_of_entry === "INVOICE" &&
        entry.sale_of_interstate === "TAXABLE_SALE" &&
        entry.tax_percent === percentage,
    );

    for (const entry of entries) {
      total += parseFloat(entry.vatamount || "0");
    }
  }

  // Add Form C entries
  const formCEntries = returns_entryRecords.filter(
    (entry: any) =>
      entry.dvat_type === DvatType.DVAT_31_A &&
      entry.category_of_entry === "INVOICE" &&
      (entry.sale_of_interstate === "FORMC" ||
        entry.purchase_type === "FORMC_CONCESSION"),
  );

  for (const entry of formCEntries) {
    total += parseFloat(entry.vatamount || "0");
  }

  // Add processed goods entries
  const processedGoodsEntries = returns_entryRecords.filter(
    (entry: any) =>
      entry.dvat_type === DvatType.DVAT_31_A &&
      entry.category_of_entry === "INVOICE" &&
      entry.sale_of_interstate === "PROCESSED_GOODS",
  );

  for (const entry of processedGoodsEntries) {
    total += parseFloat(entry.vatamount || "0");
  }

  return Math.min(amount, total);
}

// Helper function to calculate R9.3 - Net payable amount
function calculateNetPayable(
  netTax: number,
  interest: number,
  penalty: number,
  paidvatamount: number,
  paidinterestamount: number,
  paidpenaltyamount: number,
): number {
  const penaltyAmount = isNegative(penalty) ? 0 : penalty;
  const interestAmount = isNegative(interest) ? 0 : interest;
  const vatAmount = netTax;

  const vatBalance = vatAmount - paidvatamount;
  const penaltyBalance = penaltyAmount - paidpenaltyamount;
  const interestBalance = interestAmount - paidinterestamount;

  if (vatBalance <= 0) {
    return Math.max(0, penaltyBalance) + Math.max(0, interestBalance);
  }

  const excessPenalty = penaltyBalance < 0 ? Math.abs(penaltyBalance) : 0;
  const excessInterest = interestBalance < 0 ? Math.abs(interestBalance) : 0;
  const adjustedVatBalance = Math.max(
    0,
    vatBalance - excessPenalty - excessInterest,
  );

  return (
    adjustedVatBalance +
    Math.max(0, penaltyBalance) +
    Math.max(0, interestBalance)
  );
}

export default async function GetReturnsData({ dvatId }: { dvatId: number }) {
  try {
    // Get all returns_01 records for this dvat04Id
    const returns01Records = await prisma.returns_01.findMany({
      where: {
        dvat04Id: dvatId,
        deletedAt: null,
        deletedById: null,
        status: "PAID",
      },
      select: {
        id: true,
        year: true,
        month: true,
        filing_datetime: true,
        rr_number: true,
        interest: true,
        penalty: true,
        cash_payment: true,
        other_charge: true,
        transaction_date: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    if (!returns01Records || returns01Records.length === 0) {
      return {
        status: true,
        data: [],
        message: "No returns data found",
      };
    }

    // For each return period, get all required data
    const returnsData: ReturnsData[] = await Promise.all(
      returns01Records.map(async (record) => {
        // Count entries
        const entryCount = await prisma.returns_entry.count({
          where: {
            returns_01Id: record.id,
            deletedAt: null,
            deletedById: null,
          },
        });

        // Get all returns entries for calculations
        const returns_entryRecords = await prisma.returns_entry.findMany({
          where: {
            returns_01Id: record.id,
            deletedAt: null,
            deletedById: null,
          },
          select: {
            id: true,
            dvat_type: true,
            vatamount: true,
            tax_percent: true,
            category_of_entry: true,
            sale_of_interstate: true,
            purchase_type: true,
            amount: true,
          },
        });

        // Get paid challans with all necessary fields for interest calculation
        const challans = await prisma.challan.findMany({
          where: {
            returnid: record.id,
            deletedAt: null,
            deletedById: null,
            paymentstatus: "PAID",
          },
          select: {
            vat: true,
            total_tax_amount: true,
            transaction_date: true,
            createdAt: true,
            penalty: true,
            interest: true,
          },
        });

        const challanCount = challans.length;
        const vatamount = challans.reduce((sum, challan) => {
          const vatValue = parseFloat(challan.vat || "0");
          return sum + (isNaN(vatValue) ? 0 : vatValue);
        }, 0);

        // Calculate new fields
        const outputTax = await calculateOutputTax(returns_entryRecords);
        const inputCredit = await calculateInputCredit(returns_entryRecords);
        const netTax = outputTax - inputCredit;
        
        // Calculate interest using the same logic as preview page
        let interest = 0;
        if (record.month && netTax > 0) {
          const dueDate = getInterestDueDate(record.year, record.month, false);
          
          // Prepare payment data from challans
          const paymentData = challans
            .map((challan) => {
              const paymentDate = challan.transaction_date || challan.createdAt;
              const paymentAmount =
                parseFloat(challan.vat || "0") +
                parseFloat(challan.penalty || "0") +
                parseFloat(challan.interest || "0");
              
              if (!paymentDate || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
                return null;
              }
              
              return {
                amount: paymentAmount,
                date: new Date(paymentDate),
              };
            })
            .filter(
              (payment): payment is { amount: number; date: Date } =>
                payment !== null,
            );
          
          interest = calculateInterestWithPayments(
            netTax,
            dueDate,
            paymentData,
            15,
          );
        }
        
        // Calculate penalty using same logic as lateFees
        const penalty = record.month
          ? calculatePenalty(
              record.year,
              record.month,
              record.rr_number,
              record.transaction_date,
            )
          : 0;

        // Challan paid = sum of total_tax_amount from paid challans
        const challanPaid = challans.reduce((sum, challan) => {
          const amount = parseFloat(challan.total_tax_amount || "0");
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        // Calculate paid amounts from challans for pending cash calculation
        const paidvatamount = challans.reduce((sum, challan) => {
          const amount = parseFloat(challan.vat || "0");
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        const paidinterestamount = challans.reduce((sum, challan) => {
          const amount = parseFloat(challan.interest || "0");
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        const paidpenaltyamount = challans.reduce((sum, challan) => {
          const amount = parseFloat(challan.penalty || "0");
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        // Calculate pending cash using same logic as pendingcashone() from preview page
        const totalpaid = paidvatamount + paidinterestamount + paidpenaltyamount;
        const penaltyForCalc = penalty > 0 ? penalty : 0;
        const interestForCalc = interest > 0 ? interest : 0;

        let cashCarryForward = 0;
        if (netTax < 0 && interestForCalc + netTax < 0) {
          cashCarryForward = penaltyForCalc - totalpaid;
        } else {
          cashCarryForward = interestForCalc + netTax + penaltyForCalc - totalpaid;
        }

        // Calculate ITC carry forward (R9.3) using same logic as preview page
        // R9.3 = getNetPayable() + adjustAmount()
        const netPayable = calculateNetPayable(
          netTax,
          interest,
          penalty,
          paidvatamount,
          paidinterestamount,
          paidpenaltyamount,
        );
        const adjustAmount = calculateAdjustAmount(netTax, returns_entryRecords);
        const itcCarryForward = Math.max(0, netPayable + adjustAmount);

        const totalTaxAmount =
          challans.length > 0 ? challans[0].total_tax_amount : null;

        return {
          id: record.id,
          returnPeriod: record.month
            ? `${record.month}/${record.year}`
            : record.year,
          year: record.year,
          month: record.month,
          entryCount,
          challanCount,
          vatamount,
          outputTax,
          inputCredit,
          netTax,
          interest,
          penalty,
          challanPaid,
          cashCarryForward,
          itcCarryForward,
          totalTaxAmount,
        };
      }),
    );

    return {
      status: true,
      data: returnsData,
      message: "Returns data fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching returns data:", error);
    return {
      status: false,
      data: null,
      message: "Failed to fetch returns data",
    };
  }
}
