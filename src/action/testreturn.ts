"use server";

import { ApiResponseType, createResponse } from "@/models/response";
import { dvat04, returns_01 } from "@prisma/client";
import prisma from "../../prisma/database";
import { errorToString } from "@/utils/methods";
import {
  CentralSalesCalculation,
  NetTaxCalculation,
  R4Turnover,
  R5Turnover,
  TheBalance,
} from "@/components/dvatreturn/vatcalculation";

interface TestPaymentSubmitPayload {
  id: number;
}

const CHUNK_SIZE = 100;

const TestReturn = async (
  payload: TestPaymentSubmitPayload,
): Promise<ApiResponseType<returns_01 | null>> => {
  const functionname: string = TestReturn.name;

  try {
    const BATCH_SIZE = 1000;
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

    // Get total count of returns to process
    const totalCount = await prisma.returns_01.count({
      where: {
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
      throw new Error("No returns found to process");
    }

    let processedResult: returns_01 | null = null;
    let totalProcessed = 0;
    let totalFailed = 0;
    const failedRecords: Array<{ id: number; error: string }> = [];

    // Process all returns in batches using pagination
    for (let skip = 0; skip < totalCount; skip += BATCH_SIZE) {
      const batch = await prisma.returns_01.findMany({
        where: {
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
        skip: skip,
        take: BATCH_SIZE,
        orderBy: {
          id: "asc",
        },
      });

      if (batch.length === 0) break;

      // Sort this batch by year and month
      batch.sort((a, b) => {
        const yearDiff = parseInt(a.year) - parseInt(b.year);
        if (yearDiff !== 0) return yearDiff;
        return (
          monthOrder.indexOf(a.month ?? "") - monthOrder.indexOf(b.month ?? "")
        );
      });

      // Process each return in the batch with individual transactions
      for (const returnItem of batch) {
        try {
          // Process computations OUTSIDE transaction first
          const updateresponse = await prisma.returns_01.findFirst({
            where: {
              id: returnItem.id,
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
            updateresponse.dvat04.frequencyFilings === "QUARTERLY"
          );

          // Only do lightweight DB writes in transaction
          await prisma.$transaction(
            async (txPrisma) => {
              await writeProcessedReturnData(txPrisma, updateresponse, processedData);
            },
            {
              maxWait: 30000,
              timeout: 15000, // Reduced timeout since transaction is now lightweight
            }
          );

          totalProcessed++;
          processedResult = updateresponse;
        } catch (itemError) {
          totalFailed++;
          const errorMessage = itemError instanceof Error ? itemError.message : String(itemError);
          failedRecords.push({
            id: returnItem.id,
            error: errorMessage,
          });
          // Log error but continue processing next record
          console.error(`Failed to process return ID ${returnItem.id}: ${errorMessage}`);
        }
      }

      // Log progress for large datasets
      console.log(
        `Processed batch: ${totalProcessed + totalFailed}/${totalCount} returns ` +
        `(Success: ${totalProcessed}, Failed: ${totalFailed})`
      );
    }

    // Build response message with detailed statistics
    const successRate = totalCount > 0 ? Math.round((totalProcessed / totalCount) * 100) : 0;
    let responseMessage = `Processing completed. Processed ${totalProcessed}/${totalCount} returns successfully (${successRate}% success rate).`;

    if (totalFailed > 0) {
      responseMessage += ` Failed: ${totalFailed} returns.`;
      if (failedRecords.length <= 10) {
        // Include details of failures if not too many
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

  let lastmonthreturn: returns_01 | null = null;

  if (!isBeforeApril2026) {
    lastmonthreturn = await prisma.returns_01.findFirst({
      where: {
        year: year,
        month: month,
        dvat04Id: updateresponse.dvat04Id,
        deletedAt: null,
        deletedById: null,
        status: "PAID",
      },
    });

    if (!lastmonthreturn) {
      // Log warning but don't fail - use null for missing previous month
      console.warn(
        `Warning: No return found for the previous month: ${month} ${year} ` +
        `(Return ID: ${updateresponse.id}). Will use zero values for calculations.`
      );
      // Don't throw error - allow processing to continue with default values
      // lastmonthreturn remains null and calculations will use 0 as default
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
      ? parseFloat(lastmonthreturn.cash_payment ?? "0")
      : 0,
  );
  const r5Turnover = new R5Turnover(
    returnforms,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.pending_payment ?? "0")
      : 0,
  );

  // Create a copy of updateresponse with original month/year for correct penalty/interest calculation
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
      ? parseFloat(lastmonthreturn.pending_payment ?? "0")
      : 0,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.cash_payment ?? "0")
      : 0,
    isQuarterlyFiling,
  );

  const centralSales = new CentralSalesCalculation(
    returnforms,
    challans,
    returnForCalculation,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.pending_payment ?? "0")
      : 0,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.cash_payment ?? "0")
      : 0,
    isQuarterlyFiling,
  );

  const thebalance = new TheBalance(
    returnforms,
    challans,
    returnForCalculation,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.pending_payment ?? "0")
      : 0,
    !isBeforeApril2026 && lastmonthreturn
      ? parseFloat(lastmonthreturn.cash_payment ?? "0")
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
  };
}

// Write processed data to database (inside transaction)
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
  } = calculatedData;

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
        excess_cash_next_month: thebalance.excessCash().toFixed(2),
        excess_itc_next_month: thebalance.balance_carried_forward().toFixed(2),
        status: "VERIFY",
        remark: "",
        shortfall: value > 0 ? Math.abs(value).toFixed(2) : "0",
      },
    });
  } else {
    // Create returns_01_work
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
        excess_cash_next_month: thebalance.excessCash().toFixed(2),
        excess_itc_next_month: thebalance.balance_carried_forward().toFixed(2),
        status: "VERIFY",
        remark: "",
        shortfall: value > 0 ? Math.abs(value).toFixed(2) : "0",
      },
    });
  }

  // Handle interest updates (can be done after transaction or in a separate transaction)
  await updateInterestWorking(
    txPrisma,
    updateresponse,
    netTaxCalc,
  );
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

const getMonthGroup = (currentMonth: string): string[] => {
  const monthGroups = [
    ["April", "May", "June"],
    ["July", "August", "September"],
    ["October", "November", "December"],
    ["January", "February", "March"],
  ];

  // Find the group that contains the current month
  for (const group of monthGroups) {
    if (group.includes(currentMonth)) {
      return group;
    }
  }

  return [];
};

interface CreateInterestWorkingPayload {
  dvatid: number;
}
const CreateInterestWorking = async (
  payload: CreateInterestWorkingPayload,
): Promise<ApiResponseType<dvat04 | null>> => {
  const functionname: string = CreateInterestWorking.name;

  try {
    const result = await prisma.dvat04.findMany({
      where: {
        // id: payload.dvatid,
        deletedAt: null,
        deletedById: null,
      },
    });

    if (!result || result.length === 0) {
      throw new Error("Invalid dvatid, try again");
    }

    for (let i = 0; i < result.length; i++) {
      const getchallan = await prisma.challan.findMany({
        where: {
          dvatid: result[i].id,
          deletedAt: null,
          deletedById: null,
          paymentstatus: "PAID",
          NOT: {
            total_tax_amount: "0",
          },
        },
        include: {
          returns_01: true,
          dvat: true,
        },
      });

      const isquar = result[i].frequencyFilings == "QUARTERLY";

      // Quarter to months mapping
      const quarterMonthsMap: Record<string, string[]> = {
        QUARTER1: ["April", "May", "June"],
        QUARTER2: ["July", "August", "September"],
        QUARTER3: ["October", "November", "December"],
        QUARTER4: ["January", "February", "March"],
      };

      // Calculate due date based on quarterly or monthly filing

      // Get current month name
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

      for (let i = 0; i < getchallan.length; i++) {
        const paymentDate = new Date(getchallan[i].transaction_date ?? "");
        const returnMonth = getchallan[i].returns_01?.month;
        const returnYear = getchallan[i].returns_01?.year;

        // Get month index from month name
        const monthIndex = monthNames.indexOf(returnMonth ?? "");

        let dueDateYear = parseInt(
          returnYear ?? new Date().getFullYear().toString(),
        );
        let dueDateMonth: number;

        if (isquar) {
          // For quarterly filing, find next quarter's first month
          let nextQuarterFirstMonth = "April"; // Default
          for (const [quarter, months] of Object.entries(quarterMonthsMap)) {
            if (months.includes(returnMonth ?? "")) {
              // Get first month of next quarter
              if (quarter === "QUARTER1") {
                nextQuarterFirstMonth = "July";
              } else if (quarter === "QUARTER2") {
                nextQuarterFirstMonth = "October";
              } else if (quarter === "QUARTER3") {
                nextQuarterFirstMonth = "January";
              } else if (quarter === "QUARTER4") {
                nextQuarterFirstMonth = "April";
              }
              break;
            }
          }

          dueDateMonth = monthNames.indexOf(nextQuarterFirstMonth);

          // If next quarter month is earlier in the year, it's next year
          if (dueDateMonth < monthIndex) {
            dueDateYear++;
          }
        } else {
          // For monthly filing: 15th of next month
          dueDateMonth = monthIndex + 1; // Next month

          if (dueDateMonth > 11) {
            // If it goes beyond December (11)
            dueDateMonth = 0; // January
            dueDateYear++;
          }
        }

        const dueDate = new Date(dueDateYear, dueDateMonth, 15);

        // Calculate days late based on payment date vs due date
        const daysLate = Math.max(
          0,
          Math.floor(
            (paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );
        if (
          !(
            getchallan[i].total_tax_amount == "0" ||
            getchallan[i].total_tax_amount == null
          )
        ) {
          await prisma.interest_working.create({
            data: {
              dvatId: result[i].id,
              returnId: getchallan[i].returns_01!.id,
              challanId: getchallan[i].id,
              month: getchallan[i].returns_01!.month,
              outstanding_before: 0,
              interest: 0,
              payment_date: paymentDate,
              amount: getchallan[i].total_tax_amount,
              due_date: dueDate,
              days_late: daysLate,
              status: "ACTIVE",
            },
          });
        }
      }
    }
    return createResponse({
      message: "Payment completed successfully.",
      functionname,
      data: result[0],
    });
  } catch (e) {
    console.error("Error in CreateInterestWorking:", e);
    return createResponse({
      message: errorToString(e),
      functionname,
    });
  }
};

export { TestReturn, CreateInterestWorking };
