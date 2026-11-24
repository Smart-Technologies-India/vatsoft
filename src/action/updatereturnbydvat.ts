"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04, returns_01, returns_01_work } from "@prisma/client";
import prisma from "../../prisma/database";
import { errorToString } from "@/utils/methods";
import {
  CentralSalesCalculation,
  NetTaxCalculation,
  R4Turnover,
  R5Turnover,
  TheBalance,
} from "@/components/dvatreturn/vatcalculation";

interface UpdateReturnByDvatPayload {
  dvatId: number;
}

const UpdateReturnByDvat = async (
  payload: UpdateReturnByDvatPayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = UpdateReturnByDvat.name;

  try {
    const { dvatId } = payload;

    if (!dvatId || dvatId <= 0) {
      throw new Error("Invalid DVAT ID provided");
    }

    const monthOrder = [
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

    // Get total count of returns for this specific DVAT user
    const totalCount = await prisma.returns_01.count({
      where: {
        dvat04Id: dvatId,
        deletedAt: null,
        deletedById: null,
        status: "PAID",
        OR: [
          {
            return_type: "REVISED",
          },
          {
            return_type: "ORIGINAL",
          },
        ],
      },
    });

    if (totalCount === 0) {
      throw new Error(`No returns found to process for DVAT ID: ${dvatId}`);
    }

    let processedResult: returns_01 | null = null;
    let totalProcessed = 0;
    let totalFailed = 0;
    const failedRecords: Array<{ id: number; error: string }> = [];

    // Get all returns for this DVAT user, sorted by year and month
    const batch = await prisma.returns_01.findMany({
      where: {
        dvat04Id: dvatId,
        deletedAt: null,
        deletedById: null,
        status: "PAID",
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
      orderBy: [
        {
          year: "asc",
        },
        {
          month: "asc",
        },
      ],
    });

    if (batch.length === 0) {
      throw new Error(`No returns found to process for DVAT ID: ${dvatId}`);
    }

    // Sort batch by year and month
    batch.sort((a, b) => {
      const yearDiff = parseInt(a.year) - parseInt(b.year);
      if (yearDiff !== 0) return yearDiff;
      return (
        monthOrder.indexOf(a.month ?? "") - monthOrder.indexOf(b.month ?? "")
      );
    });

    // Process each return with individual transactions
    for (const returnItem of batch) {
      try {
        // Process computations OUTSIDE transaction first
        const updateresponse = await prisma.returns_01.findFirst({
          where: {
            id: returnItem.id,
            dvat04Id: dvatId,
          },
          include: {
            dvat04: true,
          },
        });

        if (!updateresponse) {
          throw new Error("Unable to fetch return data");
        }

        // Pre-process all heavy computations outside the transaction
        const processedData = await calculateReturnMetrics(
          prisma,
          updateresponse,
          updateresponse.dvat04.frequencyFilings === "QUARTERLY",
        );

        // Only do lightweight DB writes in transaction
        await prisma.$transaction(
          async (txPrisma) => {
            await writeProcessedReturnData(
              txPrisma,
              updateresponse,
              processedData,
            );
          },
          {
            maxWait: 30000,
            timeout: 15000,
          },
        );

        totalProcessed++;
        processedResult = updateresponse;
      } catch (itemError) {
        totalFailed++;
        const errorMessage =
          itemError instanceof Error ? itemError.message : String(itemError);
        failedRecords.push({
          id: returnItem.id,
          error: errorMessage,
        });
        console.error(
          `Failed to process return ID ${returnItem.id}: ${errorMessage}`,
        );
      }
    }

    // Build response message with detailed statistics
    const successRate =
      totalCount > 0 ? Math.round((totalProcessed / totalCount) * 100) : 0;
    let responseMessage = `Processing completed for DVAT ID ${dvatId}. Processed ${totalProcessed}/${totalCount} returns successfully (${successRate}% success rate).`;

    if (totalFailed > 0) {
      responseMessage += ` Failed: ${totalFailed} returns.`;
      if (failedRecords.length <= 10) {
        responseMessage += ` Failed IDs: ${failedRecords.map((r) => r.id).join(", ")}`;
      }
    }

    return createResponse({
      message: responseMessage,
      functionname,
      data: processedResult,
    });
  } catch (e) {
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

// Calculate all metrics outside of transaction
async function calculateReturnMetrics(
  prisma: any,
  updateresponse: returns_01 & { dvat04: dvat04 },
  isQuarterlyFiling: boolean,
) {
  // Store original month/year for penalty calculations
  const originalMonth: string = updateresponse.month ?? "";
  const originalYear: string = updateresponse.year;

  let month: string = originalMonth;
  let year: string = originalYear;
  const months = [
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

  if (isQuarterlyFiling) {
    year = ["April", "May", "June"].includes(month)
      ? (parseInt(year) - 1).toString()
      : year;
    switch (month) {
      case "April":
        month = "March";
        break;
      case "May":
        month = "March";
        break;
      case "June":
        month = "March";
        break;
      case "July":
        month = "June";
        break;
      case "August":
        month = "June";
        break;
      case "September":
        month = "June";
        break;
      case "October":
        month = "September";
        break;
      case "November":
        month = "September";
        break;
      case "December":
        month = "September";
        break;
      case "January":
        month = "December";
        break;
      case "February":
        month = "December";
        break;
      case "March":
        month = "December";
        break;
    }
  } else {
    if (month == "January") {
      year = (parseInt(year) - 1).toString();
    }
    if (month == "January") {
      month = "December";
    } else {
      month = months[months.indexOf(month) - 1];
    }
  }

  const isBeforeApril2026: boolean =
    parseInt(year) < 2026 ||
    (parseInt(year) === 2026 &&
      months.indexOf(month) < months.indexOf("April"));

  let lastmonthreturn: returns_01_work | null = null;

  if (!isBeforeApril2026) {
    lastmonthreturn = await prisma.returns_01_work.findFirst({
      where: {
        // year: year,
        month: month,
        dvatId: updateresponse.dvat04Id,
        // deletedAt: null,
        // deletedById: null,
        // status: "PAID",
      },
    });

    if (!lastmonthreturn) {
      console.warn(
        `Warning: No return found for the previous month: ${month} ${year} ` +
          `(Return ID: ${updateresponse.id}). Will use zero values for calculations.`,
      );
    }
  }

  let monthsToFetch: string[] = [updateresponse.month ?? ""];
  if (isQuarterlyFiling) {
    monthsToFetch = getMonthGroup(updateresponse.month ?? "");
  }

  const returnforms = await prisma.returns_entry.findMany({
    where: {
      deletedAt: null,
      deletedById: null,
      returns_01: {
        dvat04Id: updateresponse.dvat04Id,
        year: updateresponse.year,
        month: { in: monthsToFetch },
        deletedAt: null,
        deletedById: null,
      },
      status: "ACTIVE",
    },
    include: {
      seller_tin_number: true,
      state: true,
      returns_01: true,
    },
  });

  const challans = await prisma.challan.findMany({
    where: {
      deletedAt: null,
      deletedById: null,
      paymentstatus: "PAID",
      returns_01: {
        dvat04Id: updateresponse.dvat04Id,
        year: updateresponse.year,
        month: { in: monthsToFetch },
        deletedAt: null,
        deletedById: null,
      },
    },
  });

  const r4Turnover = new R4Turnover(
    returnforms,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.excess_cash_next_month ?? "0")
      : 0,
  );
  const r5Turnover = new R5Turnover(
    returnforms,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.excess_itc_next_month ?? "0")
      : 0,
  );

  const returnForCalculation: typeof updateresponse = {
    ...updateresponse,
    month: originalMonth,
    year: originalYear,
  };

  const netTaxCalc = new NetTaxCalculation(
    returnforms,
    challans,
    returnForCalculation,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.excess_itc_next_month ?? "0")
      : 0,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.excess_cash_next_month ?? "0")
      : 0,
    isQuarterlyFiling,
  );

  const centralSales = new CentralSalesCalculation(
    returnforms,
    challans,
    returnForCalculation,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.excess_itc_next_month ?? "0")
      : 0,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.excess_cash_next_month ?? "0")
      : 0,
    isQuarterlyFiling,
  );

  const thebalance = new TheBalance(
    returnforms,
    challans,
    returnForCalculation,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.excess_itc_next_month ?? "0")
      : 0,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.excess_cash_next_month ?? "0")
      : 0,
    isQuarterlyFiling,
  );

  const vatpaidchallan: number = challans.reduce((acc: number, curr: any) => {
    const vat = parseFloat(curr.vat ?? "0");
    return acc + vat;
  }, 0);
  const interestpaidchallan: number = challans.reduce(
    (acc: number, curr: any) => {
      const interest = parseFloat(curr.interest ?? "0");
      return acc + interest;
    },
    0,
  );
  const penaltypaidchallan: number = challans.reduce(
    (acc: number, curr: any) => {
      const penalty = parseFloat(curr.penalty ?? "0");
      return acc + penalty;
    },
    0,
  );
  const otherpaidchallan: number = challans.reduce((acc: number, curr: any) => {
    const others = parseFloat(curr.others ?? "0");
    return acc + others;
  }, 0);

  const value =
    netTaxCalc.total() -
    (vatpaidchallan +
      interestpaidchallan +
      penaltypaidchallan +
      otherpaidchallan);

  return {
    returnforms,
    challans,
    r4Turnover,
    r5Turnover,
    netTaxCalc,
    centralSales,
    thebalance,
    originalMonth,
    originalYear,
    isQuarterlyFiling,
    vatpaidchallan,
    interestpaidchallan,
    penaltypaidchallan,
    otherpaidchallan,
    value,
    lastmonthreturn,
  };
}

function getMonthGroup(month: string): string[] {
  const quarterMonthsMap: { [key: string]: string[] } = {
    QUARTER1: ["April", "May", "June"],
    QUARTER2: ["July", "August", "September"],
    QUARTER3: ["October", "November", "December"],
    QUARTER4: ["January", "February", "March"],
  };

  for (const [quarter, months] of Object.entries(quarterMonthsMap)) {
    if (months.includes(month)) {
      return months;
    }
  }

  return [month];
}

// Update interest working records
async function updateInterestWorking(
  prismaClient: any,
  updateresponse: returns_01 & { dvat04: dvat04 },
  netTaxCalc: any,
) {
  // Fetch interest_working records
  const response_interest = await prismaClient.interest_working.findMany({
    where: {
      returnId: updateresponse.id,
      dvatId: updateresponse.dvat04Id,
      status: "ACTIVE",
    },
    orderBy: {
      payment_date: "asc",
    },
  });

  if (response_interest && response_interest.length > 0) {
    let total = netTaxCalc.getR6_1();

    // Prepare bulk update data instead of looping
    const bulkUpdateData = [];

    for (let i = 0; i < response_interest.length; i++) {
      const amount = Number(response_interest[i].amount ?? 0);
      const amount_cal = Math.min(total, amount);
      const interest =
        ((amount_cal * 0.15) / 365) * (response_interest[i].days_late ?? 0);

      bulkUpdateData.push({
        id: response_interest[i].id,
        outstanding_before: total.toFixed(2),
        interest: interest.toFixed(2),
      });

      total = total - amount;
    }

    // Bulk update interest_working in chunks of 100
    const CHUNK_SIZE = 100;
    for (let i = 0; i < bulkUpdateData.length; i += CHUNK_SIZE) {
      const chunkData = bulkUpdateData.slice(i, i + CHUNK_SIZE);

      for (const data of chunkData) {
        await prismaClient.interest_working.update({
          where: { id: data.id },
          data: {
            outstanding_before: data.outstanding_before,
            interest: data.interest,
          },
        });
      }
    }
  }
}

// Write processed data to database within transaction
async function writeProcessedReturnData(
  txPrisma: any,
  updateresponse: returns_01 & { dvat04: dvat04 },
  calculatedData: Awaited<ReturnType<typeof calculateReturnMetrics>>,
) {
  const {
    returnforms,
    challans,
    r4Turnover,
    r5Turnover,
    netTaxCalc,
    centralSales,
    thebalance,
    originalMonth,
    originalYear,
    isQuarterlyFiling,
    vatpaidchallan,
    interestpaidchallan,
    penaltypaidchallan,
    otherpaidchallan,
    value,
    lastmonthreturn,
  } = calculatedData;

  // Check if returns_01_work entry already exists for this returnId
  const existingEntry = await txPrisma.returns_01_work.findFirst({
    where: {
      returnId: updateresponse.id,
    },
  });

  if (existingEntry) {
    // Entry already exists, skip creation
    return;
  }

  if (
    isQuarterlyFiling &&
    !["March", "June", "September", "December"].includes(
      updateresponse.month ?? "",
    )
  ) {
    await txPrisma.returns_01_work.create({
      data: {
        returnId: updateresponse.id,
        dvatId: updateresponse.dvat04Id,
        month: updateresponse.month,
        frequency: updateresponse.dvat04?.frequencyFilings ?? "MONTHLY",
        filed: true,
        tinNumber: updateresponse.dvat04.tinNumber,
        tradeName: updateresponse.dvat04.tradename,
        selectOffice: updateresponse.dvat04.selectOffice,
        commodity: updateresponse.dvat04.commodity,
        vatamount: "0",
        interest: "0",
        penalty: "0",
        other_charge: centralSales.total_decrease().toFixed(2),
        total_tax_amount: (
          r4Turnover.get4_8() -
          r5Turnover.get5_4() +
          netTaxCalc.getInterest() +
          centralSales.total_decrease() +
          netTaxCalc.getPenalty()
        ).toFixed(2),
        R4_8: r4Turnover.get4_8().toFixed(2),
        R4_9: r4Turnover.get4_9().toFixed(2),
        R4_10: r4Turnover.get4_10().toFixed(2),
        R5_4: r5Turnover.get5_4().toFixed(2),
        R5_5: r5Turnover.get5_5().toFixed(2),
        R5_6: r5Turnover.get5_6().toFixed(2),
        R6_1_balance_payable: netTaxCalc.getR6_1().toFixed(2),
        R6_INTEREST: netTaxCalc.getInterest().toFixed(2),
        R6_penalty: netTaxCalc.getPenalty().toFixed(2),
        R7_total_payable: netTaxCalc.total().toFixed(2),
        RPAID_vat: vatpaidchallan.toFixed(2),
        RPAID_interest: interestpaidchallan.toFixed(2),
        RPAID_penalty: penaltypaidchallan.toFixed(2),
        RPAID_others: otherpaidchallan.toFixed(2),
        RPAID_total: (
          vatpaidchallan +
          interestpaidchallan +
          penaltypaidchallan +
          otherpaidchallan
        ).toFixed(2),
        excess_cash_next_month: (
          thebalance.excessCash() - (value > 0 ? Math.abs(value) : 0)
        ).toFixed(2),
        excess_itc_next_month: thebalance.balance_carried_forward().toFixed(2),
        status: "VERIFY",
        remark: "",
        shortfall: value > 0 ? Math.abs(value).toFixed(2) : "0",
      },
    });
  } else {
    await txPrisma.returns_01_work.create({
      data: {
        returnId: updateresponse.id,
        dvatId: updateresponse.dvat04Id,
        month: updateresponse.month,
        frequency: updateresponse.dvat04?.frequencyFilings ?? "MONTHLY",
        filed: true,
        tinNumber: updateresponse.dvat04.tinNumber,
        tradeName: updateresponse.dvat04.tradename,
        selectOffice: updateresponse.dvat04.selectOffice,
        commodity: updateresponse.dvat04.commodity,
        vatamount: (r4Turnover.get4_8() - r5Turnover.get5_4()).toFixed(2),
        interest: netTaxCalc.getInterest().toFixed(2),
        penalty: netTaxCalc.getPenalty().toFixed(2),
        other_charge: centralSales.total_decrease().toFixed(2),
        total_tax_amount: (
          r4Turnover.get4_8() -
          r5Turnover.get5_4() +
          netTaxCalc.getInterest() +
          centralSales.total_decrease() +
          netTaxCalc.getPenalty()
        ).toFixed(2),
        R4_8: r4Turnover.get4_8().toFixed(2),
        R4_9: r4Turnover.get4_9().toFixed(2),
        R4_10: r4Turnover.get4_10().toFixed(2),
        R5_4: r5Turnover.get5_4().toFixed(2),
        R5_5: r5Turnover.get5_5().toFixed(2),
        R5_6: r5Turnover.get5_6().toFixed(2),
        R6_1_balance_payable: netTaxCalc.getR6_1().toFixed(2),
        R6_INTEREST: netTaxCalc.getInterest().toFixed(2),
        R6_penalty: netTaxCalc.getPenalty().toFixed(2),
        R7_total_payable: netTaxCalc.total().toFixed(2),
        RPAID_vat: vatpaidchallan.toFixed(2),
        RPAID_interest: interestpaidchallan.toFixed(2),
        RPAID_penalty: penaltypaidchallan.toFixed(2),
        RPAID_others: otherpaidchallan.toFixed(2),
        RPAID_total: (
          vatpaidchallan +
          interestpaidchallan +
          penaltypaidchallan +
          otherpaidchallan
        ).toFixed(2),
        excess_cash_next_month: (
          thebalance.excessCash() - (value > 0 ? Math.abs(value) : 0)
        ).toFixed(2),

        excess_itc_next_month: thebalance.balance_carried_forward().toFixed(2),
        status: "VERIFY",
        remark: "",
        shortfall: value > 0 ? Math.abs(value).toFixed(2) : "0",
      },
    });
  }

  // Handle interest updates (can be done after transaction or in a separate transaction)
  await updateInterestWorking(txPrisma, updateresponse, netTaxCalc);
}

export { UpdateReturnByDvat };
